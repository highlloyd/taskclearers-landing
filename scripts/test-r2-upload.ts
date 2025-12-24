import fs from 'fs';
import path from 'path';

// Manually load .env
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            const equalsIndex = trimmed.indexOf('=');
            if (equalsIndex !== -1) {
                const key = trimmed.substring(0, equalsIndex).trim();
                let value = trimmed.substring(equalsIndex + 1).trim();

                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn('Failed to load .env manually:', e);
}

import { saveFile, deleteFile, getFileStream } from '@/lib/upload';
// fs/promises is still needed for other functions if used, or we can use fs directly or just verify imports.
// Original file used fs/promises. We can keep it or use just fs if needed.
// The original imports were:
// import { ... } from '@/lib/upload';
// import path from 'path';
// import fs from 'fs/promises';
// We need to keep fs/promises for the main logic if it uses it.
// Actually, let's keep the imports valid.
import fsPromises from 'fs/promises';

async function testUpload() {
    console.log('Testing R2 Upload...');
    console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
    console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'Set' : 'Unset');


    try {
        // 1. Create a dummy file
        const dummyContent = 'Hello R2 World';
        const dummyFile = new File([dummyContent], 'test-resume.pdf', { type: 'application/pdf' });

        // 2. Upload
        console.log('Uploading file...');
        const filename = await saveFile(dummyFile);
        console.log('Upload success! Filename:', filename);

        // 3. Verify it exists (via stream)
        console.log('Verifying file existence...');
        const streamRes = await getFileStream(filename);

        if (streamRes && streamRes.stream) {
            console.log('File found in R2!');
        } else {
            console.error('File NOT found in R2!');
            process.exit(1);
        }

        // 4. Delete
        console.log('Deleting file...');
        await deleteFile(filename);
        console.log('Delete command sent.');

        // 5. Verify deletion (optional, might take time to propagate or return 404 immediately)
        const streamResAfter = await getFileStream(filename);
        if (!streamResAfter) {
            console.log('File successfully deleted (or not found).');
        } else {
            console.warn('File still exists after delete (might be eventual consistency).');
        }

        console.log('Test Complete!');
    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}

testUpload();
