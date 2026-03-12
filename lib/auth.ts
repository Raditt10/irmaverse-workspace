import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.notelp,
          address: user.address,
          bio: user.bio,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Link Google account if not already linked
          const hasGoogle = existingUser.accounts.some(
            (a) => a.provider === "google",
          );
          if (!hasGoogle) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            });
          }

          // Update avatar from Google if user doesn't have one
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: user.image },
            });
          }

          return true;
        } else {
          // New user from Google
          const newUser = await prisma.user.create({
            data: {
              email,
              name: user.name || email.split("@")[0],
              password: null,
              avatar: user.image,
              role: "user",
            },
          });

          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | undefined,
            },
          });

          return true;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.avatar = dbUser.avatar;
          }
        } else {
          token.id = user.id;
          token.role = (user as any).role;
          token.avatar = (user as any).avatar;
        }
      }

      if (trigger === "update" && session) {
        if (session.user.avatar) {
          token.avatar = session.user.avatar;
        }
        if (session.user.name) {
          token.name = session.user.name;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | undefined;
      }
      return session;
    },
  },
});
