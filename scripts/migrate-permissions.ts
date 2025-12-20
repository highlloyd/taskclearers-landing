import { db, adminUsers } from '../lib/db';
import { ALL_PERMISSIONS } from '../lib/auth/permissions';
import { asc, eq } from 'drizzle-orm';

async function migratePermissions() {
  console.log('Starting permissions migration...');

  const users = await db
    .select()
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));

  if (users.length === 0) {
    console.log('No users to migrate.');
    return;
  }

  console.log(`Found ${users.length} admin user(s)`);

  // First user gets all permissions (super admin)
  const firstUser = users[0];

  for (const user of users) {
    if (user.id === firstUser.id) {
      // First user becomes super admin
      await db
        .update(adminUsers)
        .set({ permissions: JSON.stringify(ALL_PERMISSIONS) })
        .where(eq(adminUsers.id, user.id));
      console.log(`Granted ALL permissions to first user: ${user.email} (Super Admin)`);
    } else if (!user.permissions) {
      // Other users with no permissions stay that way (pending)
      console.log(`User ${user.email} has no permissions (pending approval)`);
    } else {
      // User already has permissions, keep them
      console.log(`User ${user.email} already has permissions - skipping`);
    }
  }

  console.log('\nMigration complete!');
  console.log('First user is now Super Admin with all permissions.');
  console.log('Other users need to be granted permissions manually via /admin/users');
}

migratePermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
