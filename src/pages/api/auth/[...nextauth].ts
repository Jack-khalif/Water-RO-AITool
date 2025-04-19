import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || {
        host: 'localhost',
        port: 1025,
        auth: { user: '', pass: '' },
      },
      from: process.env.EMAIL_FROM || 'test@example.com',
      maxAge: 10 * 60, // Magic link valid for 10 minutes
      async sendVerificationRequest({ identifier, url }) {
        // Dev fallback for magic links
        if (!process.env.EMAIL_SERVER && process.env.NODE_ENV !== 'production') {
          console.log(`\nMagic Link for ${identifier}:\n${url}\n`);
        }
        // No else needed — NextAuth will handle sending email if EMAIL_SERVER is set
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',  // Custom sign-in page
    error: '/',   // Redirect errors to homepage too
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
};

export default NextAuth(authOptions);
