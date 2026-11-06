import path from 'path'
import { promises as fs } from 'fs'

export interface PathValidationResult {
  valid: boolean
  safePath: string
  error?: string
}

/**
 * Validates that a user-supplied key or file path is strictly contained within the base upload directory.
 * 
 * Rejects:
 * - Empty, whitespace, or non-string keys
 * - Null byte injections (%00, \0)
 * - Absolute paths (POSIX / or Windows C:\, UNC \\)
 * - Directory traversal sequences (../, ..\)
 * - Encoded traversal sequences (%2e%2e)
 * - Prefix collision attacks (/uploads-fake vs /uploads)
 * - Symlink-based breakouts resolving outside the base directory
 */
export async function validateUploadPath(
  rawKey: string,
  uploadsDir: string
): Promise<PathValidationResult> {
  // 1. Basic type and emptiness check
  if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
    return { valid: false, safePath: '', error: 'File key is required and cannot be empty.' }
  }

  // 2. Reject null byte injection attempts
  if (rawKey.includes('\0') || rawKey.includes('%00')) {
    return { valid: false, safePath: '', error: 'Null byte injection detected in file path.' }
  }

  // 3. Decode URI components carefully
  let decodedKey = rawKey
  try {
    decodedKey = decodeURIComponent(rawKey)
  } catch {
    return { valid: false, safePath: '', error: 'Malformed URI encoding in file key.' }
  }

  if (decodedKey.includes('\0')) {
    return { valid: false, safePath: '', error: 'Null byte injection detected in decoded file path.' }
  }

  // 4. Reject absolute paths immediately before path resolution
  const isPosixAbsolute = decodedKey.startsWith('/') || decodedKey.startsWith('\\')
  const isWindowsAbsolute = /^[a-zA-Z]:[\\\/]/.test(decodedKey)
  const isUncPath = /^\\\\[^\\]+\\[^\\]+/.test(decodedKey)

  if (isPosixAbsolute || isWindowsAbsolute || isUncPath || path.isAbsolute(decodedKey)) {
    return { valid: false, safePath: '', error: 'Absolute file paths are strictly prohibited.' }
  }

  // 5. Canonical resolution of base directory
  const baseDir = path.resolve(uploadsDir)

  // 6. Resolve target path relative to base directory
  // Normalizing removes duplicate slashes and self-referential '.'
  const normalizedKey = path.normalize(decodedKey).replace(/^[\\\/]+/, '')
  const resolvedTarget = path.resolve(baseDir, normalizedKey)

  // 7. Strict containment verification using path.relative()
  // path.relative(from, to) returns:
  // - '' if from === to
  // - 'sub/path' if to is inside from
  // - '../sibling' if to is outside from
  // - 'C:\...' on Windows if on different drive
  const rel = path.relative(baseDir, resolvedTarget)

  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    return {
      valid: false,
      safePath: '',
      error: 'Directory traversal detected: Target path resolves outside the permitted directory.',
    }
  }

  // Double check prefix boundary (guards against prefix collision e.g. /uploads-fake vs /uploads)
  const baseDirWithSep = baseDir.endsWith(path.sep) ? baseDir : baseDir + path.sep
  if (!resolvedTarget.startsWith(baseDirWithSep)) {
    return {
      valid: false,
      safePath: '',
      error: 'Prefix collision detected: Target path is not within the uploads directory tree.',
    }
  }

  // 8. Symlink Escape Verification
  // Check if any existing ancestor directory or the file itself is a symlink resolving outside baseDir
  try {
    const realBase = await fs.realpath(baseDir).catch(() => baseDir)
    
    // Check if resolvedTarget or its parent directories already exist
    let currentCheck = resolvedTarget
    while (currentCheck !== baseDir && currentCheck !== path.dirname(currentCheck)) {
      try {
        const stats = await fs.lstat(currentCheck)
        if (stats.isSymbolicLink()) {
          const realTarget = await fs.realpath(currentCheck)
          const realRel = path.relative(realBase, realTarget)
          if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
            return {
              valid: false,
              safePath: '',
              error: 'Symlink escape detected: Symbolic link resolves outside the permitted directory.',
            }
          }
        }
      } catch {
        // Path segment does not exist yet (normal for new uploads), continue up
      }
      currentCheck = path.dirname(currentCheck)
    }
  } catch {
    // If realpath inspection fails, proceed with the verified resolvedTarget
  }

  return {
    valid: true,
    safePath: resolvedTarget,
  }
}

/**
 * Safely writes an upload buffer to disk, neutralizing TOCTOU (Time of Check to Time of Use)
 * symlink replacement attacks.
 * 
 * Uses atomic temporary file creation with exclusive create flags (O_CREAT | O_EXCL)
 * followed by atomic rename, guaranteeing that no symlink can be followed during write.
 */
export async function safeWriteUploadFile(
  safePath: string,
  buffer: Buffer,
  uploadsDir: string
): Promise<void> {
  const baseDir = path.resolve(uploadsDir)
  const realBase = await fs.realpath(baseDir).catch(() => baseDir)

  // 1. Inspect all parent directory components for symlink interception
  const fileDir = path.dirname(safePath)
  await fs.mkdir(fileDir, { recursive: true })

  let current = fileDir
  while (current !== baseDir && current !== path.dirname(current)) {
    const stat = await fs.lstat(current)
    if (stat.isSymbolicLink()) {
      const real = await fs.realpath(current)
      const rel = path.relative(realBase, real)
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error('Security Error: Directory component in path is a symlink escaping base directory.')
      }
    }
    current = path.dirname(current)
  }

  // 2. Pre-write check: if target exists, reject if it is a symbolic link
  try {
    const targetStat = await fs.lstat(safePath)
    if (targetStat.isSymbolicLink()) {
      throw new Error('Security Error: Refusing to overwrite existing symbolic link.')
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err
  }

  // 3. Atomic Write Pattern:
  // Write to a random temporary file in the verified directory using exclusive create flags (O_CREAT | O_EXCL)
  // This guarantees that the write operation cannot follow an existing symlink.
  const tempFileName = `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`
  const tempPath = path.join(fileDir, tempFileName)

  let fileHandle
  try {
    fileHandle = await fs.open(
      tempPath,
      fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY
    )
    await fileHandle.writeFile(buffer)
    await fileHandle.close()
    fileHandle = null

    // 4. Pre-rename parent directory re-verification (Race-hardening):
    // Confirms that no intermediate directory was replaced with a symlink/junction during write.
    let preRenameCheck = fileDir
    while (preRenameCheck !== baseDir && preRenameCheck !== path.dirname(preRenameCheck)) {
      const preStat = await fs.lstat(preRenameCheck)
      if (preStat.isSymbolicLink()) {
        throw new Error('Security Error: Parent directory component was replaced with a symlink during write.')
      }
      preRenameCheck = path.dirname(preRenameCheck)
    }

    const preRealDir = await fs.realpath(fileDir)
    const preRel = path.relative(realBase, preRealDir)
    if (preRel.startsWith('..') || path.isAbsolute(preRel)) {
      throw new Error('Security Error: Parent directory escaped base directory during write.')
    }

    // 5. Atomic Rename to target destination
    // In both POSIX and Windows (NTFS), atomic rename replaces the directory entry itself
    // rather than following any pre-existing symlink target.
    await fs.rename(tempPath, safePath)

    // 6. Post-write verification: confirm final physical file does not escape baseDir
    const realTarget = await fs.realpath(safePath)
    const finalRel = path.relative(realBase, realTarget)
    if (finalRel.startsWith('..') || path.isAbsolute(finalRel)) {
      try { await fs.unlink(safePath) } catch {}
      throw new Error('Security Error: Post-write realpath escaped permitted base directory.')
    }
  } catch (err) {
    if (fileHandle) {
      try { await fileHandle.close() } catch {}
    }
    try { await fs.unlink(tempPath) } catch {}
    throw err
  }
}

/**
 * Safely deletes a file from the uploads directory, ensuring symlinks are never followed outside.
 */
export async function safeUnlinkUploadFile(
  safePath: string,
  uploadsDir: string
): Promise<void> {
  const baseDir = path.resolve(uploadsDir)
  const realBase = await fs.realpath(baseDir).catch(() => baseDir)

  try {
    // 1. Verify parent directory chain before inspection or deletion
    const fileDir = path.dirname(safePath)
    let dirCheck = fileDir
    while (dirCheck !== baseDir && dirCheck !== path.dirname(dirCheck)) {
      const dirStat = await fs.lstat(dirCheck)
      if (dirStat.isSymbolicLink()) {
        throw new Error('Security Error: Refusing deletion through symlinked parent directory.')
      }
      dirCheck = path.dirname(dirCheck)
    }

    const realDir = await fs.realpath(fileDir).catch(() => fileDir)
    const dirRel = path.relative(realBase, realDir)
    if (dirRel.startsWith('..') || path.isAbsolute(dirRel)) {
      throw new Error('Security Error: Parent directory resolves outside base directory.')
    }

    const stat = await fs.lstat(safePath)
    if (stat.isSymbolicLink()) {
      // Unlink the symlink itself without following it
      await fs.unlink(safePath)
      return
    }

    const realTarget = await fs.realpath(safePath)
    const rel = path.relative(realBase, realTarget)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('Security Error: Refusing to delete file outside base directory.')
    }

    await fs.unlink(safePath)
  } catch (err: any) {
    if (err.code === 'ENOENT') return // Already absent
    throw err
  }
}
