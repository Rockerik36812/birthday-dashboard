'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'register' | 'login'>('loading')

  useEffect(() => {
    fetch('/api/registration-status')
      .then((r) => r.json())
      .then((data) => {
        // Primer usuario (sin admins) → registro; ya hay admin → login
        router.replace(data.totalUsers === 0 ? '/register' : '/login')
        setStatus(data.totalUsers === 0 ? 'register' : 'login')
      })
      .catch(() => {
        // Si la API falla, ir al login (ruta existente) sin crashear
        router.replace('/login')
        setStatus('login')
      })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-600 via-pink-500 to-orange-400">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-lg font-medium">Preparando tu fiesta...</p>
      </div>
    </div>
  )
}