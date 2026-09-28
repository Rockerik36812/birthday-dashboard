import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'Magic Link',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email() }).safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user) {
          const newUser = await prisma.user.create({
            data: {
              email: parsed.data.email,
              emailVerified: new Date(),
            },
          })
          return { id: newUser.id, email: newUser.email, name: newUser.nombre ?? undefined }
        }

        return { id: user.id, email: user.email, name: user.nombre ?? undefined }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
})

export const { GET, POST } = handlers

// Exportar auth, signIn, signOut para uso en otros archivos
// export { auth, signIn, signOut } from '@/lib/auth'

// Configuración para API routes
// export const authOptions = {
//   adapter: PrismaAdapter(prisma),
//   session: { strategy: 'jwt' as const },
//   pages: {
//     signIn: '/login',
//     error: '/login',
//   },
//   providers: [
//     Credentials({
//       name: 'Magic Link',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//       },
//       async authorize(credentials: any) {
//         const parsed = z.object({ email: z.string().email() }).safeParse(credentials)
//         if (!parsed.success) return null
//
//         const user = await prisma.user.findUnique({
//           where: { email: parsed.data.email },
//         })
//
//         if (!user) {
//           const newUser = await prisma.user.create({
//             data: {
//               email: parsed.data.email,
//               emailVerified: new Date(),
//             },
//           })
//           return { id: newUser.id, email: newUser.email, name: newUser.nombre ?? undefined }
//         }
//
//         return { id: user.id, email: user.email, name: user.nombre ?? undefined }
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }: any) {
//       if (user) {
//         token.id = user.id
//         token.email = user.email
//       }
//       return token
//     },
//     async session({ session, token }: any) {
//       if (session.user) {
//         session.user.id = token.id as string
//         session.user.email = token.email as string
//       }
//       return session
//     },
//   },
// }