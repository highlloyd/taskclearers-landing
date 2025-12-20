import { db, adminUsers } from '../lib/db';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npm run seed:admin <email>');
    console.error('Example: npm run seed:admin admin@taskclearers.com');
    process.exit(1);
  }

  const domain = process.env.ADMIN_EMAIL_DOMAIN || 'taskclearers.com';
  if (!email.toLowerCase().endsWith(`@${domain}`)) {
    console.error(`Error: Email must end with @${domain}`);
    process.exit(1);
  }

  // Check if user already exists
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    console.log(`Admin user ${email} already exists.`);
    process.exit(0);
  }

  await db.insert(adminUsers).values({
    id: nanoid(),
    email: email.toLowerCase(),
    name: email.split('@')[0],
  });

  console.log(`Created admin user: ${email}`);
  console.log('They can now log in at /admin/login');
}

seedAdmin().catch(console.error);
