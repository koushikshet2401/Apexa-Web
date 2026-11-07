async function testLogin() {
  const res = await fetch('http://localhost:3001/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@apexpacificholdings.com',
      password: 'TestPassword123!',
    }),
  })

  console.log('Login status:', res.status)
  console.log('Set-Cookie:', res.headers.get('set-cookie'))
  const data = await res.json()
  console.log('Body:', data)
}

testLogin().catch(console.error)
