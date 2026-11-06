import fs from 'fs'
import path from 'path'
import { validateUploadPath, safeWriteUploadFile, safeUnlinkUploadFile } from '../../src/lib/pathSecurity'

async function runSymlinkTests() {
  const baseUploads = path.join(process.cwd(), 'prisma/tests/uploads_sandbox')
  if (!fs.existsSync(baseUploads)) fs.mkdirSync(baseUploads, { recursive: true })

  const outsideDir = path.join(process.cwd(), 'src/lib')
  const junctionPath = path.join(baseUploads, 'escaped_junction')

  try {
    if (fs.existsSync(junctionPath)) fs.unlinkSync(junctionPath)
    fs.symlinkSync(outsideDir, junctionPath, 'junction')

    console.log('[TEST] Junction created pointing outside uploadsDir to src/lib')

    // Test 1: validateUploadPath should detect the symlink escape
    const check = await validateUploadPath('escaped_junction/auth.ts', baseUploads)
    console.log('[TEST 1] validateUploadPath result:', check)

    // Test 2: safeWriteUploadFile should refuse to write through junction
    let writeThrew = false
    try {
      await safeWriteUploadFile(
        path.join(junctionPath, 'malicious.txt'),
        Buffer.from('evil payload'),
        baseUploads
      )
    } catch (e: any) {
      writeThrew = true
      console.log('[TEST 2] safeWriteUploadFile blocked write through junction:', e.message)
    }

    // Test 3: safeUnlinkUploadFile
    const normalFile = path.join(baseUploads, 'normal_test.txt')
    await safeWriteUploadFile(normalFile, Buffer.from('safe content'), baseUploads)
    console.log('[TEST 3A] Normal write succeeded')
    await safeUnlinkUploadFile(normalFile, baseUploads)
    console.log('[TEST 3B] Normal unlink succeeded')

    // Cleanup junction
    fs.unlinkSync(junctionPath)
    fs.rmdirSync(baseUploads)
    console.log('[CLEANUP] Sandbox cleaned up successfully')

    return {
      test1Passed: !check.valid && check.error?.includes('Symlink escape detected'),
      test2Passed: writeThrew,
    }
  } catch (err: any) {
    console.error('Symlink test failure:', err)
    try {
      if (fs.existsSync(junctionPath)) fs.unlinkSync(junctionPath)
      if (fs.existsSync(baseUploads)) fs.rmdirSync(baseUploads)
    } catch {}
    throw err
  }
}

runSymlinkTests().then(console.log).catch(console.error)
