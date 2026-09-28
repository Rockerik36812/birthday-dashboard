import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Render dinámico — siempre consulta la BD en cada request
export const dynamic = 'force-dynamic'

export default async function Home() {
  let totalUsers = 0
  try {
    totalUsers = await prisma.user.count()
  } catch {
    totalUsers = 0
  }

  // Primer usuario → registro de administrador
  if (totalUsers === 0) {
    redirect('/register')
  }
  redirect('/login')
}