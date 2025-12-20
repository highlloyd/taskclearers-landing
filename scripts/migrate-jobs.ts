import { db, jobs } from '../lib/db';
import { jobOpenings } from '../app/careers/positions';
import { eq } from 'drizzle-orm';

async function migrateJobs() {
  console.log('Starting job migration...');

  for (const job of jobOpenings) {
    // Check if job already exists
    const [existing] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, job.id))
      .limit(1);

    if (existing) {
      console.log(`Job "${job.title}" already exists, skipping...`);
      continue;
    }

    await db.insert(jobs).values({
      id: job.id,
      title: job.title,
      location: job.location,
      department: job.department,
      description: job.description,
      isActive: true,
    });

    console.log(`Migrated job: ${job.title}`);
  }

  console.log(`\nMigration complete! Migrated ${jobOpenings.length} jobs.`);
}

migrateJobs().catch(console.error);
