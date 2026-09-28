import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// No prerender: debe leer el conteo real de la BD en cada request
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({ 
      registrationClosed: count > 0,
      totalUsers: count
    })
  } catch {
    return NextResponse.json({ registrationClosed: false, totalUsers: 0 })
  }
}
