import { redirect } from 'next/navigation'

async function getRegistrationStatus() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://cumple.erikservicios.click'
  try {
    const res = await fetch(`${baseUrl}/api/registration-status`, { 
      cache: 'no-store'
    })
    return await res.json()
  } catch {
    // Si falla la llamada, permitimos registro por defecto
    return { registrationClosed: false, totalUsers: 0 }
  }
}

export default async function Home() {
  const status = await getRegistrationStatus()
  
  if (!status.registrationClosed) {
    redirect('/register')
  } else {
    redirect('/login')
  }
}
