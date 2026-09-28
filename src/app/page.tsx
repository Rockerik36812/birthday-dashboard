import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/registration-status`, {
      cache: 'no-store'
    })
    const data = await res.json()
    
    if (!data.registrationClosed) {
      redirect('/register')
    } else {
      redirect('/login')
    }
  } catch {
    redirect('/login')
  }
}
