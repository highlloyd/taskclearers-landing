import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { db, adminUsers, magicLinkTokens, sessions } from '@/lib/db';
import { eq, and, gt, count } from 'drizzle-orm';
import {
  Permission,
  ALL_PERMISSIONS,
  parsePermissions,
} from './permissions';

export type AdminUser = typeof adminUsers.$inferSelect;

// JWT secret must be set in production and staging
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  // Require JWT_SECRET in production and staging environments
  if (!secret && (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'preview')) {
    throw new Error('JWT_SECRET environment variable is required in production and staging');
  }
  if (!secret) {
    console.warn('WARNING: Using development JWT secret. Do not use in production!');
  }
  return new TextEncoder().encode(secret || 'dev-secret-not-for-production');
}

const ADMIN_EMAIL_DOMAIN = process.env.ADMIN_EMAIL_DOMAIN || 'taskclearers.com';
const SESSION_DURATION_DAYS = 14; // Reduced from 30 for better security
const TOKEN_LENGTH = 8; // Alphanumeric token length
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars: 0, O, I, 1

export function isValidAdminEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`);
}

// Generate a cryptographically random alphanumeric token
function generateSecureToken(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(byte => TOKEN_CHARS[byte % TOKEN_CHARS.length])
    .join('');
}

export async function createMagicLinkToken(email: string): Promise<string> {
  if (!isValidAdminEmail(email)) {
    throw new Error(`Only @${ADMIN_EMAIL_DOMAIN} emails are allowed`);
  }

  // Generate a unique alphanumeric token (8 chars = ~40 bits of entropy)
  let token = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    token = generateSecureToken(TOKEN_LENGTH);
    const existing = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.token, token))
      .limit(1);

    if (existing.length === 0) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique token');
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes (reduced from 15)

  await db.insert(magicLinkTokens).values({
    id: nanoid(),
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  return token;
}

export async function verifyMagicLinkToken(email: string, token: string): Promise<boolean> {
  const [record] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.token, token),
        eq(magicLinkTokens.email, email.toLowerCase()),
        gt(magicLinkTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!record || record.usedAt) {
    return false;
  }

  // Mark token as used
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.id, record.id));

  return true;
}

export async function createSession(email: string): Promise<string> {
  // Check if this will be the first user ever
  const [userCount] = await db.select({ count: count() }).from(adminUsers);
  const isFirstUser = userCount.count === 0;

  // Get or create admin user
  let [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    const id = nanoid();
    // First user gets all permissions, others get none
    const permissions = isFirstUser ? JSON.stringify(ALL_PERMISSIONS) : null;

    await db.insert(adminUsers).values({
      id,
      email: email.toLowerCase(),
      name: email.split('@')[0],
      permissions,
    });
    [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  }

  // Update last login
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  // Create session
  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  // Parse permissions for JWT
  const userPermissions = parsePermissions(user.permissions);

  // Create JWT for cookie with permissions included
  const jwt = await new SignJWT({
    sessionId,
    userId: user.id,
    permissions: userPermissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getJwtSecret());

  return jwt;
}

export async function getSession(): Promise<{
  user: typeof adminUsers.$inferSelect;
  sessionId: string;
  permissions: Permission[];
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sessionId = payload.sessionId as string;

    // Check if session exists and is valid
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return null;
    }

    // Get user
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, session.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Parse permissions from user record (not JWT, to ensure fresh data)
    const permissions = parsePermissions(user.permissions);

    return { user, sessionId, permissions };
  } catch {
    return null;
  }
}

export async function logout(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function requireAuth(): Promise<{
  user: typeof adminUsers.$inferSelect;
  sessionId: string;
  permissions: Permission[];
}> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Re-export permission utilities for convenience
export type { Permission } from './permissions';
export {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  parsePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from './permissions';
