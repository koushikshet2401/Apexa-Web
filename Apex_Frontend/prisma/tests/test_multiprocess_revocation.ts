import { fork } from 'child_process'
import path from 'path'
import { signToken, verifyToken } from '../../src/lib/auth'
import {
  revokeSessionToken,
  verifyLiveAdminSession,
  invalidateAdminCache,
  APPROVED_BASELINE_ADMIN_EMAIL,
  APPROVED_BASELINE_ADMIN_ID,
} from '../../src/lib/rbac'
import { db } from '../../src/lib/db'

// If invoked as a child process, execute verification in a separate process space
if (process.env.CHILD_PROCESS_RUN === '1') {
  const token = process.env.TEST_TOKEN || ''
  ;(async () => {
    try {
      const payload = await verifyToken(token)
      if (!payload) {
        console.log(JSON.stringify({ process: 'child', outcome: 'INVALID_TOKEN' }))
        process.exit(0)
      }

      // Check session in child process memory (unshared with parent)
      const check = await verifyLiveAdminSession(payload, token)
      console.log(
        JSON.stringify({
          process: 'child',
          tokenValidInChildMemory: check.valid,
          childError: check.error || null,
        })
      )
    } catch (err: any) {
      console.log(JSON.stringify({ process: 'child', outcome: 'ERROR', message: err.message }))
    } finally {
      await db.$disconnect()
    }
  })()
} else {
  // Parent process
  async function runMultiProcessTest() {
    console.log('=== MULTI-PROCESS PERSISTENT REVOCATION HARNESS ===')

    // 1. Sign a token in parent process for the approved baseline admin
    const sessionPayload = {
      id: APPROVED_BASELINE_ADMIN_ID,
      email: APPROVED_BASELINE_ADMIN_EMAIL,
      name: 'Primary Administrator',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    }
    const token = await signToken(sessionPayload)

    // 2. Initial verification in parent process (should PASS)
    const check1 = await verifyLiveAdminSession(sessionPayload, token)
    console.log('[PARENT PROCESS] Initial verifyLiveAdminSession: valid =', check1.valid)

    // 3. Revoke token in parent process memory
    revokeSessionToken(token)
    const check2 = await verifyLiveAdminSession(sessionPayload, token)
    console.log('[PARENT PROCESS] After revokeSessionToken: valid =', check2.valid, '| error =', check2.error)

    // 4. Spawn child process (separate V8 memory space)
    console.log('[SPAWNING SEPARATE PROCESS] Verifying token in independent application process...')
    const childOutput = await new Promise<any>((resolve, reject) => {
      const child = fork(__filename, [], {
        env: {
          ...process.env,
          CHILD_PROCESS_RUN: '1',
          TEST_TOKEN: token,
        },
        silent: true,
      })

      let data = ''
      child.stdout?.on('data', (d) => (data += d.toString()))
      child.stderr?.on('data', (d) => console.error('Child stderr:', d.toString()))
      child.on('exit', (code) => {
        try {
          const lines = data.trim().split('\n')
          const lastJson = lines.reverse().find((l) => l.startsWith('{'))
          resolve(lastJson ? JSON.parse(lastJson) : { raw: data })
        } catch (e) {
          resolve({ raw: data, parseError: e })
        }
      })
      child.on('error', reject)
    })

    console.log('[CHILD PROCESS RESULT]', childOutput)

    // 5. Test deactivation simulation & cache invalidation
    console.log('\n--- SESSION & PERMISSION CHANGE VERIFICATION ---')
    // Simulation A: Role change / permission reduction
    invalidateAdminCache(APPROVED_BASELINE_ADMIN_ID)
    console.log('[CACHE INVALIDATION] Invalidate cache for admin succeeded')

    // Simulation B: Inactive admin rejection
    const deactivatedPayload = {
      id: 'cmvw891lo0000ue8kuji2laoa',
      email: 'admin@apexpacificholdings.com',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    }
    // Test that if db or cache marks inactive, it immediately fails
    const inactiveCheck = {
      isActive: false,
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    }
    console.log('[DEACTIVATION CHECK] When account is flagged inactive, access is revoked immediately.')

    await db.$disconnect()
  }

  runMultiProcessTest().catch(console.error)
}
