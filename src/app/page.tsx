"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Check registration status client-side
    fetch('/api/registration-status')
      .then(res => res.json())
      .then(data => {
        if (!data.registrationClosed) {
          router.replace('/register')
        } else {
          router.replace('/login')
        }
      })
      .catch(() => {
        // Default: go to register if something fails
        router.replace('/register')
      })
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 text-lg">Cargando...</p>
      </div>
    </div>
  )
}
