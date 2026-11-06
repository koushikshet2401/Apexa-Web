import { signToken, verifyToken } from '../../src/lib/auth'
import {
  verifyLiveAdminSession,
  revokeSessionToken,
  revokeAdminSessions,
  getAdminSessionVersion,
  APPROVED_BASELINE_ADMIN_EMAIL,
  APPROVED_BASELINE_ADMIN_ID,
} from '../../src/lib/rbac'

async function runTest() {
  console.log('=================================================================')
  console.log('TEST: ALL-DEVICE LOGOUT AND SESSION RESURRECTION IMMUNITY')
  console.log('=================================================================')

  // Step 1: Issue Token A (Device A) with current version
  const versionA = getAdminSessionVersion(APPROVED_BASELINE_ADMIN_ID)
  const tokenA = await signToken({
    id: APPROVED_BASELINE_ADMIN_ID,
    email: APPROVED_BASELINE_ADMIN_EMAIL,
    name: 'Admin Device A',
    role: 'SUPER_ADMIN',
    permissions: ['*'],
    sessionVersion: versionA,
  })
  console.log(`[1] Token A issued for Device A with sessionVersion: ${versionA}`)

  // Step 2: Issue Token B (Device B) with current version
  const tokenB = await signToken({
    id: APPROVED_BASELINE_ADMIN_ID,
    email: APPROVED_BASELINE_ADMIN_EMAIL,
    name: 'Admin Device B',
    role: 'SUPER_ADMIN',
    permissions: ['*'],
    sessionVersion: versionA,
  })
  console.log(`[2] Token B issued for Device B with sessionVersion: ${versionA}`)

  // Initial check: both tokens are valid
  const sessionA0 = await verifyToken(tokenA)
  const sessionB0 = await verifyToken(tokenB)
  const checkA0 = await verifyLiveAdminSession(sessionA0!, tokenA)
  const checkB0 = await verifyLiveAdminSession(sessionB0!, tokenB)
  console.log('[Initial] Token A valid:', checkA0.valid, '| Token B valid:', checkB0.valid)

  if (!checkA0.valid || !checkB0.valid) {
    throw new Error('Initial tokens failed validation!')
  }

  // Step 3: Device B executes All-Device Logout
  // In logout handler with allDevices=true: revokeAdminSessions is called, which increments sessionVersion
  const newVersion = revokeAdminSessions(APPROVED_BASELINE_ADMIN_ID)
  revokeSessionToken(tokenB)
  console.log(`[3] All-device logout executed by Device B -> sessionVersion incremented to: ${newVersion}`)

  // Step 4: Verify both Token A and Token B are rejected
  const checkA1 = await verifyLiveAdminSession(sessionA0!, tokenA)
  const checkB1 = await verifyLiveAdminSession(sessionB0!, tokenB)
  console.log('[4] Post-Logout: Token A valid:', checkA1.valid, `(${checkA1.error})`)
  console.log('[4] Post-Logout: Token B valid:', checkB1.valid, `(${checkB1.error})`)

  if (checkA1.valid || checkB1.valid) {
    throw new Error('FAILURE at Step 4: Tokens were not rejected after all-device logout!')
  }

  // Step 5: Administrator logs in again on Device C -> obtain Token C with the new version
  const versionC = getAdminSessionVersion(APPROVED_BASELINE_ADMIN_ID)
  const tokenC = await signToken({
    id: APPROVED_BASELINE_ADMIN_ID,
    email: APPROVED_BASELINE_ADMIN_EMAIL,
    name: 'Admin Device C',
    role: 'SUPER_ADMIN',
    permissions: ['*'],
    sessionVersion: versionC,
  })
  console.log(`[5] New login executed -> Token C issued with sessionVersion: ${versionC}`)

  // Step 6: Replay Token A and Token B
  const sessionC = await verifyToken(tokenC)
  const checkC = await verifyLiveAdminSession(sessionC!, tokenC)
  const checkA2 = await verifyLiveAdminSession(sessionA0!, tokenA)
  const checkB2 = await verifyLiveAdminSession(sessionB0!, tokenB)

  console.log('[6 & 8] Token C (new login) valid:', checkC.valid)
  console.log('[6 & 7] Token A (Device A) replayed valid:', checkA2.valid, `(${checkA2.error})`)
  console.log('[6 & 7] Token B (Device B) replayed valid:', checkB2.valid, `(${checkB2.error})`)

  if (checkA2.valid === false && checkB2.valid === false && checkC.valid === true) {
    console.log('\n✅ IMMUNITY VERIFIED: Older tokens CANNOT BE RESURRECTED!')
    console.log('Token A (sessionVersion 1) remained rejected (current version is 2).')
    console.log('Token B (sessionVersion 1) remained rejected.')
    console.log('Token C (sessionVersion 2) is accepted.')
  } else {
    throw new Error('Resurrection vulnerability detected!')
  }
}

runTest().catch((err) => {
  console.error(err)
  process.exit(1)
})
