import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Ensure Node.js runtime for NextAuth to avoid edge bundling issues
export const runtime = 'nodejs';