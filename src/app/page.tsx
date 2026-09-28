import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware gestiona redirección según estado de registro y auth
  redirect('/login')
}
