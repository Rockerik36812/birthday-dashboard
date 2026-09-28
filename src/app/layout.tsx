import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Birthday Dashboard | Panel de Cumpleaños',
  description: 'Gestiona y celebra los cumpleaños de tu equipo de forma bonita y sencilla',
  keywords: ['cumpleaños', 'dashboard', 'equipo', 'empresa', 'celebración', 'whatsapp'],
  authors: [{ name: 'Erik Servicios' }],
  creator: 'Erik Servicios',
  publisher: 'Erik Servicios',
  robots: 'noindex, nofollow',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Birthday Dashboard',
    title: 'Birthday Dashboard | Panel de Cumpleaños',
    description: 'Gestiona y celebra los cumpleaños de tu equipo de forma bonita y sencilla',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Birthday Dashboard',
    description: 'Gestiona y celebra los cumpleaños de tu equipo',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#EC407A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-MX" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}