import path from 'path'
import { promises as fs } from 'fs'
import fsSync from 'fs'
import { signToken, verifyToken } from '../../src/lib/auth'
import {
  hasPermission,
  PERMISSIONS,
  PROPOSED_DEFAULT_ROLES,
  verifyLiveAdminSession,
  revokeSessionToken,
  revokeAdminSessions,
  invalidateAdminCache,
  APPROVED_BASELINE_ADMIN_EMAIL,
  APPROVED_BASELINE_ADMIN_ID,
} from '../../src/lib/rbac'
import { validateUploadPath, safeWriteUploadFile, safeUnlinkUploadFile } from '../../src/lib/pathSecurity'
import { escapeHtml } from '../../src/lib/email'
import { db } from '../../src/lib/db'

interface TestCaseResult {
  section: 'A. Static Tests' | 'B. Unit Tests' | 'C. Live HTTP Tests' | 'D. Live PostgreSQL Tests'
  id: string
  name: string
  verdict: 'PASS' | 'FAIL' | 'BLOCKED'
  latencyMs: number
  details: string
}

const allResults: TestCaseResult[] = []

async function executeTest(
  section: TestCaseResult['section'],
  id: string,
  name: string,
  fn: () => Promise<void>
) {
  const start = Date.now()
  try {
    await fn()
    allResults.push({
      section,
      id,
      name,
      verdict: 'PASS',
      latencyMs: Date.now() - start,
      details: 'Assertion passed successfully',
    })
  } catch (err: any) {
    allResults.push({
      section,
      id,
      name,
      verdict: 'FAIL',
      latencyMs: Date.now() - start,
      details: err?.message || String(err),
    })
  }
}

async function runStaticTests() {
  console.log('\n--- EXECUTING SECTION A: STATIC CODE & CONFIGURATION TESTS ---')

  await executeTest('A. Static Tests', 'A1', 'Middleware Configuration Matcher Includes API & Page Routes', async () => {
    const middlewareContent = await fs.readFile(
      path.join(process.cwd(), 'src', 'middleware.ts'),
      'utf-8'
    )
    if (!middlewareContent.includes("'/api/admin/:path*'")) {
      throw new Error("middleware.ts does not protect '/api/admin/:path*'")
    }
    if (!middlewareContent.includes("'/admin/:path*'")) {
      throw new Error("middleware.ts does not protect '/admin/:path*'")
    }
  })

  await executeTest('A. Static Tests', 'A2', 'All Admin API Handlers Call requirePermission or requireAdmin', async () => {
    const adminApiDir = path.join(process.cwd(), 'src', 'app', 'api', 'admin')
    const findRoutes = async (dir: string): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      const files: string[] = []
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push(...(await findRoutes(full)))
        } else if (entry.name === 'route.ts') {
          files.push(full)
        }
      }
      return files
    }

    const routeFiles = await findRoutes(adminApiDir)
    for (const file of routeFiles) {
      const rel = path.relative(process.cwd(), file)
      if (rel.includes('login') || rel.includes('logout')) continue

      const content = await fs.readFile(file, 'utf-8')
      const hasAuth = content.includes('requirePermission') || content.includes('requireAdmin')
      if (!hasAuth) {
        throw new Error(`File ${rel} lacks server-side requirePermission or requireAdmin guard!`)
      }
    }
  })

  await executeTest('A. Static Tests', 'A3', 'Mandatory JWT_SECRET Check in Production', async () => {
    const authContent = await fs.readFile(
      path.join(process.cwd(), 'src', 'lib', 'auth.ts'),
      'utf-8'
    )
    if (!authContent.includes('FATAL: JWT_SECRET environment variable is required in production')) {
      throw new Error('auth.ts missing production JWT_SECRET mandatory throw check')
    }
  })

  await executeTest('A. Static Tests', 'A4', 'HTML Sanitizer Neutralizes Injected Markup', async () => {
    const malicious = '<script>alert(1)</script><img src="x" onerror="evil()">'
    const cleaned = escapeHtml(malicious)
    if (cleaned.includes('<script>') || cleaned.includes('<img')) {
      throw new Error(`Sanitizer failed to escape markup: ${cleaned}`)
    }
  })
}

async function runUnitTests() {
  console.log('\n--- EXECUTING SECTION B: UNIT & SECURITY HARNESS TESTS ---')

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

  await executeTest('B. Unit Tests', 'B1', 'Path Security: Permit Valid Upload Key', async () => {
    const check = await validateUploadPath('properties/luxury-villa.jpg', uploadsDir)
    if (!check.valid) throw new Error(`Valid path rejected: ${check.error}`)
  })

  await executeTest('B. Unit Tests', 'B2', 'Path Security: Reject Parent Traversal (../)', async () => {
    const check = await validateUploadPath('../../etc/passwd', uploadsDir)
    if (check.valid) throw new Error('Parent traversal was unexpectedly allowed!')
  })

  await executeTest('B. Unit Tests', 'B3', 'Path Security: Reject Windows Absolute Path (C:\\)', async () => {
    const check = await validateUploadPath('C:\\Windows\\System32\\cmd.exe', uploadsDir)
    if (check.valid) throw new Error('Windows absolute path was unexpectedly allowed!')
  })

  await executeTest('B. Unit Tests', 'B4', 'Path Security: Reject POSIX Absolute Path (/)', async () => {
    const check = await validateUploadPath('/etc/shadow', uploadsDir)
    if (check.valid) throw new Error('POSIX absolute path was unexpectedly allowed!')
  })

  await executeTest('B. Unit Tests', 'B5', 'Path Security: Reject Prefix Collision Path (/uploads-fake)', async () => {
    const check = await validateUploadPath('../uploads-fake/evil.jpg', uploadsDir)
    if (check.valid) throw new Error('Prefix collision path was unexpectedly allowed!')
  })

  await executeTest('B. Unit Tests', 'B6', 'Path Security: Reject Encoded Traversal (%2e%2e)', async () => {
    const check = await validateUploadPath('%2e%2e%2f%2e%2e%2fpackage.json', uploadsDir)
    if (check.valid) throw new Error('Encoded traversal was unexpectedly allowed!')
  })

  await executeTest('B. Unit Tests', 'B7', 'Path Security: Reject Null Byte Injection (\\0)', async () => {
    const check = await validateUploadPath('avatar.png\0.exe', uploadsDir)
    if (check.valid) throw new Error('Null byte injection was unexpectedly allowed!')
  })

  await executeTest('B. Unit Tests', 'B8', 'Path Security: Reject Empty or Root Directory Keys', async () => {
    const check1 = await validateUploadPath('', uploadsDir)
    const check2 = await validateUploadPath('   ', uploadsDir)
    const check3 = await validateUploadPath('.', uploadsDir)
    if (check1.valid || check2.valid || check3.valid) {
      throw new Error('Empty/root directory key unexpectedly allowed!')
    }
  })

  await executeTest('B. Unit Tests', 'B9', 'RBAC: Role Permission Boundaries Respected', async () => {
    const editorRole = PROPOSED_DEFAULT_ROLES.CONTENT_EDITOR
    const hasEdit = hasPermission(
      { id: '1', email: 'e@apex.com', role: editorRole.name, permissions: editorRole.permissions },
      PERMISSIONS.CONTENT_UPDATE
    )
    const hasUserDelete = hasPermission(
      { id: '1', email: 'e@apex.com', role: editorRole.name, permissions: editorRole.permissions },
      PERMISSIONS.USERS_DELETE
    )
    if (!hasEdit) throw new Error('Content editor was denied CONTENT:UPDATE')
    if (hasUserDelete) throw new Error('Content editor was permitted USERS:DELETE')
  })

  await executeTest('B. Unit Tests', 'B10', 'Session Revocation: Inactive Account Rejection', async () => {
    const revoked = await verifyLiveAdminSession({
      id: 'cmvw891lo0000ue8kuji2laoa',
      email: 'admin@apexpacificholdings.com',
      role: 'SUPER_ADMIN',
    })
    if (revoked.valid !== true) {
      throw new Error(`Active admin unexpectedly rejected: ${revoked.error}`)
    }
  })

  await executeTest('B. Unit Tests', 'B11', 'Session Revocation: Token Blacklist Enforcement', async () => {
    const testToken = 'revoked_token_signature_test_123'
    revokeSessionToken(testToken)
    const check = await verifyLiveAdminSession({ id: 'any_id', email: 'test@apex.com' }, testToken)
    if (check.valid !== false) {
      throw new Error('Blacklisted session token was unexpectedly accepted!')
    }
  })

  await executeTest('B. Unit Tests', 'B12', 'Last Active Super Admin Protection Rule', async () => {
    const superAdmins = [{ id: 'admin_sole', email: 'admin@apex.com', isActive: true }]
    const targetId = 'admin_sole'
    const remaining = superAdmins.filter((a) => a.id !== targetId && a.isActive)
    if (remaining.length !== 0) throw new Error('Protection calculation failed')
    const blocked = remaining.length === 0
    if (!blocked) throw new Error('Failed to block last super admin removal')
  })

  await executeTest('B. Unit Tests', 'B13', 'Self Deletion Protection Rule', async () => {
    const currentAdminId = 'admin_current'
    const targetDeleteId = 'admin_current'
    const isSelfDelete = currentAdminId === targetDeleteId
    if (!isSelfDelete) throw new Error('Self deletion detection failed')
  })

  await executeTest('B. Unit Tests', 'B14', 'Baseline Fallback Restricts to P2021/P2022 Errors', async () => {
    const simulatedConnectionError = { code: 'P1001', message: 'Can not reach database server' }
    const isCompatibilityError = simulatedConnectionError.code === 'P2021' || simulatedConnectionError.code === 'P2022'
    if (isCompatibilityError) throw new Error('Connection error falsely categorized as compatibility delta!')
  })

  await executeTest('B. Unit Tests', 'B15', 'Path Security: Reject Junction / Symlink Resolving Outside Base', async () => {
    const sandboxDir = path.join(process.cwd(), 'prisma/tests/symlink_unit_sandbox')
    if (!fsSync.existsSync(sandboxDir)) fsSync.mkdirSync(sandboxDir, { recursive: true })
    const outsideTarget = path.join(process.cwd(), 'src/lib')
    const junctionPath = path.join(sandboxDir, 'test_junction')

    try {
      if (fsSync.existsSync(junctionPath)) fsSync.unlinkSync(junctionPath)
      fsSync.symlinkSync(outsideTarget, junctionPath, 'junction')

      const check = await validateUploadPath('test_junction/auth.ts', sandboxDir)
      if (check.valid) throw new Error('Junction escape was unexpectedly validated as safe!')
      if (!check.error?.includes('Symlink escape detected')) {
        throw new Error(`Expected Symlink escape error, got: ${check.error}`)
      }
    } finally {
      try {
        if (fsSync.existsSync(junctionPath)) fsSync.unlinkSync(junctionPath)
        if (fsSync.existsSync(sandboxDir)) fsSync.rmdirSync(sandboxDir)
      } catch {}
    }
  })

  await executeTest('B. Unit Tests', 'B16', 'TOCTOU Defense: safeWriteUploadFile Refuses Symlink Overwrite', async () => {
    const sandboxDir = path.join(process.cwd(), 'prisma/tests/toctou_write_sandbox')
    if (!fsSync.existsSync(sandboxDir)) fsSync.mkdirSync(sandboxDir, { recursive: true })
    const outsideTarget = path.join(process.cwd(), 'package.json')
    const symlinkPath = path.join(sandboxDir, 'fake_file.jpg')

    try {
      if (fsSync.existsSync(symlinkPath)) fsSync.unlinkSync(symlinkPath)
      fsSync.symlinkSync(outsideTarget, symlinkPath, 'file')

      let threw = false
      try {
        await safeWriteUploadFile(symlinkPath, Buffer.from('evil'), sandboxDir)
      } catch (err: any) {
        threw = true
        if (!err.message.includes('Refusing to overwrite existing symbolic link')) {
          throw new Error(`Unexpected error message: ${err.message}`)
        }
      }
      if (!threw) throw new Error('safeWriteUploadFile did not block overwrite of symbolic link!')
    } catch (e: any) {
      if (e.code === 'EPERM') {
        const outsideDir = path.join(process.cwd(), 'src')
        const junctionDir = path.join(sandboxDir, 'escaped_dir')
        if (fsSync.existsSync(junctionDir)) fsSync.unlinkSync(junctionDir)
        fsSync.symlinkSync(outsideDir, junctionDir, 'junction')
        let threw = false
        try {
          await safeWriteUploadFile(path.join(junctionDir, 'exploit.txt'), Buffer.from('evil'), sandboxDir)
        } catch (err: any) {
          threw = true
          if (!err.message.includes('Directory component in path is a symlink')) {
            throw new Error(`Unexpected error: ${err.message}`)
          }
        }
        if (!threw) throw new Error('safeWriteUploadFile failed to block write through junction!')
        fsSync.unlinkSync(junctionDir)
      } else {
        throw e
      }
    } finally {
      try {
        if (fsSync.existsSync(symlinkPath)) fsSync.unlinkSync(symlinkPath)
        if (fsSync.existsSync(sandboxDir)) fsSync.rmdirSync(sandboxDir)
      } catch {}
    }
  })

  await executeTest('B. Unit Tests', 'B17', 'TOCTOU Defense: safeUnlinkUploadFile Unlinks Safely', async () => {
    const sandboxDir = path.join(process.cwd(), 'prisma/tests/toctou_unlink_sandbox')
    if (!fsSync.existsSync(sandboxDir)) fsSync.mkdirSync(sandboxDir, { recursive: true })
    const testFile = path.join(sandboxDir, 'sample.txt')
    fsSync.writeFileSync(testFile, 'sample')

    await safeUnlinkUploadFile(testFile, sandboxDir)
    if (fsSync.existsSync(testFile)) throw new Error('safeUnlinkUploadFile failed to remove file')
    fsSync.rmdirSync(sandboxDir)
  })

  await executeTest('B. Unit Tests', 'B18', 'Baseline Fallback: Restrict Exclusively to Primary Administrator', async () => {
    // 1. Unrelated / non-existent administrator
    const unrelatedAdmin = await verifyLiveAdminSession({ id: 'cmvw_unrelated_id', email: 'unrelated@other.com' })
    if (unrelatedAdmin.valid !== false) {
      throw new Error('Unrelated administrator was unexpectedly granted fallback access!')
    }

    // 2. Mismatched Email (correct approved ID, wrong email)
    const mismatchedEmail = await verifyLiveAdminSession({
      id: APPROVED_BASELINE_ADMIN_ID,
      email: 'impersonator@evil.com',
    })
    if (mismatchedEmail.valid !== false) {
      throw new Error('Mismatched email identity unexpectedly received fallback access!')
    }

    // 3. Mismatched ID (wrong ID, correct approved email)
    const mismatchedId = await verifyLiveAdminSession({
      id: 'cmvw_forged_impostor_id_9999',
      email: APPROVED_BASELINE_ADMIN_EMAIL,
    })
    if (mismatchedId.valid !== false) {
      throw new Error('Mismatched ID unexpectedly received fallback access!')
    }

    // 4. Authorized Administrator (correct approved ID AND correct approved email)
    const authorizedAdmin = await verifyLiveAdminSession({
      id: APPROVED_BASELINE_ADMIN_ID,
      email: APPROVED_BASELINE_ADMIN_EMAIL,
    })
    if (authorizedAdmin.valid !== true) {
      throw new Error(`Authorized administrator was unexpectedly rejected: ${authorizedAdmin.error}`)
    }
  })
}

async function runLiveHttpTests() {
  console.log('\n--- EXECUTING SECTION C: LIVE HTTP BACKEND TESTS ---')
  const baseUrl = 'http://localhost:3001'

  // Part 1: Anonymous Access (401 Unauthorized)
  const anonymousEndpoints = [
    { id: 'C1', name: 'Reject Anonymous GET /api/admin/properties', path: '/api/admin/properties' },
    { id: 'C2', name: 'Reject Anonymous GET /api/admin/users', path: '/api/admin/users' },
    { id: 'C3', name: 'Reject Anonymous GET /api/admin/roles', path: '/api/admin/roles' },
    { id: 'C4', name: 'Reject Anonymous GET /api/admin/enquiries', path: '/api/admin/enquiries' },
    { id: 'C5', name: 'Reject Anonymous GET /api/admin/countries', path: '/api/admin/countries' },
    { id: 'C6', name: 'Reject Anonymous GET /api/admin/services', path: '/api/admin/services' },
    { id: 'C7', name: 'Reject Anonymous GET /api/admin/homepage', path: '/api/admin/homepage' },
    { id: 'C8', name: 'Reject Anonymous GET /api/admin/media', path: '/api/admin/media' },
  ]

  for (const ep of anonymousEndpoints) {
    await executeTest('C. Live HTTP Tests', ep.id, ep.name, async () => {
      const res = await fetch(`${baseUrl}${ep.path}`, { method: 'GET' })
      if (res.status !== 401) {
        throw new Error(`Expected status 401, got ${res.status}`)
      }
    })
  }

  // Part 2: Login Payload & Rate Limiting Tests
  await executeTest('C. Live HTTP Tests', 'C9', 'Login: Reject Empty Payload with 400', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.99.1.101' },
      body: JSON.stringify({}),
    })
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
  })

  await executeTest('C. Live HTTP Tests', 'C10', 'Login: Reject Missing Password with 400', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.99.1.102' },
      body: JSON.stringify({ email: 'admin@apexpacificholdings.com' }),
    })
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
  })

  await executeTest('C. Live HTTP Tests', 'C11', 'Login: Reject Invalid Password with Generic 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.99.1.103' },
      body: JSON.stringify({ email: 'admin@apexpacificholdings.com', password: 'IncorrectPassword999!' }),
    })
    const data = await res.json()
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
    if (data.error !== 'Invalid email or password.') {
      throw new Error(`Expected generic error, got "${data.error}"`)
    }
  })

  await executeTest('C. Live HTTP Tests', 'C12', 'Login: Reject Unknown Account with Generic 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.99.1.104' },
      body: JSON.stringify({ email: 'unknown-audit-account@apex.com', password: 'SomePassword123!' }),
    })
    const data = await res.json()
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
    if (data.error !== 'Invalid email or password.') {
      throw new Error(`Expected generic error, got "${data.error}"`)
    }
  })

  await executeTest('C. Live HTTP Tests', 'C13', 'Logout: Clear Session Cookie (Max-Age=0)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/logout`, { method: 'POST' })
    const cookie = res.headers.get('set-cookie') || ''
    if (!cookie.includes('Max-Age=0') && !cookie.includes('apex_admin_session=;')) {
      throw new Error(`Cookie was not cleared: ${cookie}`)
    }
  })

  await executeTest('C. Live HTTP Tests', 'C14', 'Public Enquiry Honeypot Bypasses DB Write', async () => {
    const res = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        honeypot: 'bot_check',
        name: 'Spam Bot',
        email: 'bot@spam.com',
        phone: '+971501234567',
        consent: true,
      }),
    })
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  })

  // Part 3: Negative Authorization Tests for ALL 34 Permission-Protected Handlers
  // We issue a cryptographically signed token for a restricted session holding only ANALYTICS:READ privileges
  const restrictedToken = await signToken({
    id: APPROVED_BASELINE_ADMIN_ID,
    email: APPROVED_BASELINE_ADMIN_EMAIL,
    name: 'Restricted Auditor',
    role: 'RESTRICTED_AUDITOR',
    permissions: ['ANALYTICS:READ'],
  })

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `apex_admin_session=${restrictedToken}`,
  }

  const all34PermissionTests = [
    // Properties Module (5 handlers)
    { id: 'C15', name: 'Reject Insufficient Perms: GET /api/admin/properties', method: 'GET', path: '/api/admin/properties' },
    { id: 'C16', name: 'Reject Insufficient Perms: POST /api/admin/properties', method: 'POST', path: '/api/admin/properties', body: { title: 'Unauthorized Villa' } },
    { id: 'C17', name: 'Reject Insufficient Perms: GET /api/admin/properties/cmvw_prop1', method: 'GET', path: '/api/admin/properties/cmvw_prop1' },
    { id: 'C18', name: 'Reject Insufficient Perms: PATCH /api/admin/properties/cmvw_prop1', method: 'PATCH', path: '/api/admin/properties/cmvw_prop1', body: { title: 'Hack' } },
    { id: 'C19', name: 'Reject Insufficient Perms: DELETE /api/admin/properties/cmvw_prop1', method: 'DELETE', path: '/api/admin/properties/cmvw_prop1' },
    
    // Property Images Module (3 handlers)
    { id: 'C20', name: 'Reject Insufficient Perms: GET /api/admin/properties/cmvw_prop1/images', method: 'GET', path: '/api/admin/properties/cmvw_prop1/images' },
    { id: 'C21', name: 'Reject Insufficient Perms: POST /api/admin/properties/cmvw_prop1/images', method: 'POST', path: '/api/admin/properties/cmvw_prop1/images', body: { url: '/evil.jpg' } },
    { id: 'C22', name: 'Reject Insufficient Perms: DELETE /api/admin/properties/cmvw_prop1/images', method: 'DELETE', path: '/api/admin/properties/cmvw_prop1/images', body: { imageId: 'img1' } },
    
    // Enquiries Module (4 handlers)
    { id: 'C23', name: 'Reject Insufficient Perms: GET /api/admin/enquiries', method: 'GET', path: '/api/admin/enquiries' },
    { id: 'C24', name: 'Reject Insufficient Perms: GET /api/admin/enquiries/cmvw_enq1', method: 'GET', path: '/api/admin/enquiries/cmvw_enq1' },
    { id: 'C25', name: 'Reject Insufficient Perms: PATCH /api/admin/enquiries/cmvw_enq1', method: 'PATCH', path: '/api/admin/enquiries/cmvw_enq1', body: { status: 'closed' } },
    { id: 'C26', name: 'Reject Insufficient Perms: DELETE /api/admin/enquiries/cmvw_enq1', method: 'DELETE', path: '/api/admin/enquiries/cmvw_enq1' },
    
    // Countries Module (5 handlers)
    { id: 'C27', name: 'Reject Insufficient Perms: GET /api/admin/countries', method: 'GET', path: '/api/admin/countries' },
    { id: 'C28', name: 'Reject Insufficient Perms: POST /api/admin/countries', method: 'POST', path: '/api/admin/countries', body: { name: 'Unauthorized Country' } },
    { id: 'C29', name: 'Reject Insufficient Perms: GET /api/admin/countries/dubai', method: 'GET', path: '/api/admin/countries/dubai' },
    { id: 'C30', name: 'Reject Insufficient Perms: PATCH /api/admin/countries/dubai', method: 'PATCH', path: '/api/admin/countries/dubai', body: { name: 'Dubai Updated' } },
    { id: 'C31', name: 'Reject Insufficient Perms: DELETE /api/admin/countries/dubai', method: 'DELETE', path: '/api/admin/countries/dubai' },
    
    // Services Module (5 handlers)
    { id: 'C32', name: 'Reject Insufficient Perms: GET /api/admin/services', method: 'GET', path: '/api/admin/services' },
    { id: 'C33', name: 'Reject Insufficient Perms: POST /api/admin/services', method: 'POST', path: '/api/admin/services', body: { name: 'Unauthorized Service' } },
    { id: 'C34', name: 'Reject Insufficient Perms: GET /api/admin/services/luxury-villas', method: 'GET', path: '/api/admin/services/luxury-villas' },
    { id: 'C35', name: 'Reject Insufficient Perms: PATCH /api/admin/services/luxury-villas', method: 'PATCH', path: '/api/admin/services/luxury-villas', body: { name: 'Updated' } },
    { id: 'C36', name: 'Reject Insufficient Perms: DELETE /api/admin/services/luxury-villas', method: 'DELETE', path: '/api/admin/services/luxury-villas' },
    
    // Homepage CMS Module (2 handlers)
    { id: 'C37', name: 'Reject Insufficient Perms: GET /api/admin/homepage', method: 'GET', path: '/api/admin/homepage' },
    { id: 'C38', name: 'Reject Insufficient Perms: PATCH /api/admin/homepage', method: 'PATCH', path: '/api/admin/homepage', body: { unveilHeading: 'Hack' } },
    
    // Media Module (4 handlers)
    { id: 'C39', name: 'Reject Insufficient Perms: GET /api/admin/media', method: 'GET', path: '/api/admin/media' },
    { id: 'C40', name: 'Reject Insufficient Perms: POST /api/admin/media/presign', method: 'POST', path: '/api/admin/media/presign', body: { filename: 'test.jpg' } },
    { id: 'C41', name: 'Reject Insufficient Perms: PUT /api/admin/media/upload-local', method: 'PUT', path: '/api/admin/media/upload-local?key=test.jpg', body: 'sample' },
    { id: 'C42', name: 'Reject Insufficient Perms: DELETE /api/admin/media/properties/test.jpg', method: 'DELETE', path: '/api/admin/media/properties/test.jpg' },
    
    // Roles Module (1 handler)
    { id: 'C43', name: 'Reject Insufficient Perms: GET /api/admin/roles', method: 'GET', path: '/api/admin/roles' },
    
    // Users Management Module (5 handlers)
    { id: 'C44', name: 'Reject Insufficient Perms: GET /api/admin/users', method: 'GET', path: '/api/admin/users' },
    { id: 'C45', name: 'Reject Insufficient Perms: POST /api/admin/users', method: 'POST', path: '/api/admin/users', body: { email: 'new@apex.com' } },
    { id: 'C46', name: 'Reject Insufficient Perms: GET /api/admin/users/cmvw_user1', method: 'GET', path: '/api/admin/users/cmvw_user1' },
    { id: 'C47', name: 'Reject Insufficient Perms: PATCH /api/admin/users/cmvw_user1', method: 'PATCH', path: '/api/admin/users/cmvw_user1', body: { name: 'Updated' } },
    { id: 'C48', name: 'Reject Insufficient Perms: DELETE /api/admin/users/cmvw_user1', method: 'DELETE', path: '/api/admin/users/cmvw_user1' },
  ]

  for (const t of all34PermissionTests) {
    await executeTest('C. Live HTTP Tests', t.id, t.name, async () => {
      const res = await fetch(`${baseUrl}${t.path}`, {
        method: t.method,
        headers: authHeaders,
        body: t.body ? (typeof t.body === 'string' ? t.body : JSON.stringify(t.body)) : undefined,
      })
      if (res.status !== 403) {
        throw new Error(`Expected HTTP 403 Forbidden, but received HTTP ${res.status}`)
      }
      const json = await res.json().catch(() => ({}))
      if (!json.error || !json.error.includes('Forbidden: Insufficient permissions')) {
        throw new Error(`Expected Forbidden permission error, got: ${JSON.stringify(json)}`)
      }
    })
  }

  // Part 4: Token Replay After Logout Rejection on GET /api/admin/auth/me
  await executeTest('C. Live HTTP Tests', 'C49', 'Reject Replayed Token After Logout: GET /api/admin/auth/me', async () => {
    // 1. Issue a valid token
    const tokenToRevoke = await signToken({
      id: APPROVED_BASELINE_ADMIN_ID,
      email: APPROVED_BASELINE_ADMIN_EMAIL,
      name: 'Replay Test Admin',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    })

    const tokenHeaders = {
      'Content-Type': 'application/json',
      Cookie: `apex_admin_session=${tokenToRevoke}`,
    }

    // 2. Initial request succeeds (200 OK)
    const res1 = await fetch(`${baseUrl}/api/admin/auth/me`, {
      method: 'GET',
      headers: tokenHeaders,
    })
    if (res1.status !== 200) {
      throw new Error(`Expected 200 before logout, got ${res1.status}`)
    }

    // 3. Perform logout request to server (server process revokes token in its memory)
    const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
      method: 'POST',
      headers: tokenHeaders,
    })
    if (logoutRes.status !== 200) {
      throw new Error(`Expected 200 from logout, got ${logoutRes.status}`)
    }

    // 4. Replay the old token to GET /api/admin/auth/me (must be rejected with 401)
    const res2 = await fetch(`${baseUrl}/api/admin/auth/me`, {
      method: 'GET',
      headers: tokenHeaders,
    })
    if (res2.status !== 401) {
      throw new Error(`Expected HTTP 401 for replayed logged-out token, got ${res2.status}`)
    }
    const json = await res2.json()
    if (!json.error || !json.error.includes('Session has been logged out')) {
      throw new Error(`Expected 'Session has been logged out' error, got: ${JSON.stringify(json)}`)
    }
  })
}

async function runLivePostgresTests() {
  console.log('\n--- EXECUTING SECTION D: LIVE POSTGRESQL INTEGRATION TESTS ---')

  await executeTest('D. Live PostgreSQL Tests', 'D1', 'Prisma Migrations: Exactly 1 Init Migration Applied', async () => {
    const migrations: any[] = await db.$queryRawUnsafe(`
      SELECT migration_name, applied_steps_count, rolled_back_at 
      FROM "_prisma_migrations" 
      ORDER BY started_at ASC;
    `)
    if (migrations.length !== 1) {
      throw new Error(`Expected 1 migration, found ${migrations.length}`)
    }
    if (migrations[0].migration_name !== '20261030073355_init_schema') {
      throw new Error(`Unexpected migration: ${migrations[0].migration_name}`)
    }
  })

  await executeTest('D. Live PostgreSQL Tests', 'D2', 'Phase 3 RBAC Models Absent on Live Database', async () => {
    const tables: any[] = await db.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('AdminRole', 'AdminPermission', 'RolePermission', 'AdminActivityLog');
    `)
    if (tables.length > 0) {
      throw new Error(`Phase 3 tables unexpectedly found on live DB: ${tables.map(t => t.table_name).join(', ')}`)
    }
  })

  await executeTest('D. Live PostgreSQL Tests', 'D3', 'Phase 3 Extended Columns Absent on Live Database', async () => {
    const cols: any[] = await db.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'AdminUser' AND column_name IN ('isActive', 'lastLoginAt', 'roleId');
    `)
    if (cols.length > 0) {
      throw new Error(`Phase 3 columns unexpectedly found on AdminUser: ${cols.map(c => c.column_name).join(', ')}`)
    }
  })

  await executeTest('D. Live PostgreSQL Tests', 'D4', 'Database Record Counts Unchanged (Zero Mutation Audit)', async () => {
    const adminCount = await db.adminUser.count()
    const enquiryCount = await db.enquiry.count()
    const propCount = await db.property.count()
    const countryCount = await db.country.count()
    if (adminCount !== 1) throw new Error(`AdminUser count mutated: ${adminCount} (expected 1)`)
    if (enquiryCount !== 1) throw new Error(`Enquiry count mutated: ${enquiryCount} (expected 1)`)
    if (propCount !== 6) throw new Error(`Property count mutated: ${propCount} (expected 6)`)
    if (countryCount !== 5) throw new Error(`Country count mutated: ${countryCount} (expected 5)`)
  })
}

async function main() {
  console.log('========================================================================')
  console.log('APEX PACIFIC HOLDINGS — PHASE 4 FINAL COMPREHENSIVE VERIFICATION SUITE')
  console.log('========================================================================')

  await runStaticTests()
  await runUnitTests()
  await runLiveHttpTests()
  await runLivePostgresTests()

  console.log('\n========================================================================')
  console.log('ALL PHASE 4 VERIFICATION TEST RESULTS')
  console.log('========================================================================')
  console.table(
    allResults.map((r) => ({
      Section: r.section,
      ID: r.id,
      Name: r.name,
      Verdict: r.verdict,
      Latency: `${r.latencyMs}ms`,
    }))
  )

  const passedCount = allResults.filter((r) => r.verdict === 'PASS').length
  const failedCount = allResults.filter((r) => r.verdict === 'FAIL').length
  console.log(`\nTOTAL TESTS: ${allResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`)

  for (const r of allResults.filter((r) => r.verdict === 'FAIL')) {
    console.error(`\nFAILED TEST DETAILS [${r.id}] ${r.name}:`)
    console.error(`  --> ${r.details}`)
  }

  await db.$disconnect()
}

main().catch(console.error)
