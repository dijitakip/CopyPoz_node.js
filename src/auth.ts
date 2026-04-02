import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/src/backend/utils/db"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Kullanıcı Adı", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Kullanıcı adı ve şifre gereklidir.")
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        })

        if (!user) {
          throw new Error("Kullanıcı bulunamadı.")
        }

        if (user.status !== 'active') {
          throw new Error(
            "Hesabınız henüz aktif değil. Kayıt sırasında gönderilen e-postadaki doğrulama bağlantısını kullanın."
          )
        }

        const isValid = await compare(credentials.password as string, user.password_hash)

        if (!isValid) {
          throw new Error("Hatalı şifre.")
        }

        return {
          id: user.id.toString(),
          name: user.username,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
