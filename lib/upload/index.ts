import { nanoid } from 'nanoid';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = './uploads';
const ALLOWED_TYPES = ['application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const MAX_FILE_SIZE = MAX_SIZE;
export const MAX_FILE_SIZE_MB = 5;

// Employee document configuration
const EMPLOYEE_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];
const EMPLOYEE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const EMPLOYEE_MAX_FILE_SIZE = EMPLOYEE_MAX_SIZE;
export const EMPLOYEE_MAX_FILE_SIZE_MB = 10;

const MIME_TO_EXT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
};

// Initialize S3 Client for Cloudflare R2
// Uses AWS SDK standard env vars + R2-specific endpoint
const R2_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3;
const R2_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const hasR2Credentials = R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME;

const s3Client = hasR2Credentials
  ? new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
  : null;

export async function saveFile(file: File): Promise<string> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF file.');
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Validate extension security
  const ext = path.extname(file.name).toLowerCase();

  // Strict check for general upload (must be PDF)
  if (file.type === 'application/pdf' && ext !== '.pdf') {
    throw new Error('Invalid file extension. Expected .pdf');
  }

  // Double check based on mapped types just in case allowed types changes
  if (MIME_TO_EXT[file.type] && !MIME_TO_EXT[file.type].includes(ext)) {
    throw new Error(`Invalid file extension for type ${file.type}`);
  }

  const filename = `${nanoid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Try R2 first if configured
  if (s3Client && R2_BUCKET_NAME) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
          Body: buffer,
          ContentType: file.type,
        })
      );
      return filename;
    } catch (error) {
      console.error('R2 upload failed:', error);
      // Fallback to local storage (or throw if preferred - implementing fallback for robustness)
    }
  }

  // Fallback to local storage
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);

  return filename;
}

export async function deleteFile(filename: string): Promise<void> {
  // Try R2
  if (s3Client && R2_BUCKET_NAME) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
        })
      );
    } catch (error) {
      console.error('R2 delete failed (might verify if local file exists):', error);
    }
  }

  // Always try local delete as well (legacy files)
  const filepath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filepath);
  } catch {
    // File might not exist, ignore error
  }
}

export async function getFilePath(filename: string): Promise<string | null> {
  // Logic updated: This function was originally returning a local path.
  // With R2, we don't have a local path.
  // The consumer 'app/api/files/[...path]/route.ts' reads this path.
  // We need to support both.

  // 1. Check local file first (fastest for legacy)
  const filepath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.access(filepath);
    return filepath;
  } catch {
    // 2. If not local, return null. The API route will need to handle R2 retrieval directly
    // or we need to refactor this function to return a stream or buffer.
    // For now, returning null indicates "not on local disk".
    // We'll update the API route to handle R2 if getFilePath returns null.
    return null;
  }
}

// Helper to get R2 object stream
export async function getFileStream(filename: string) {
  if (!s3Client || !R2_BUCKET_NAME) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
    });
    const response = await s3Client.send(command);
    return {
      stream: response.Body as ReadableStream,
      contentType: response.ContentType,
    };
  } catch (error) {
    return null;
  }
}

// Employee document functions - Migration to R2
export async function saveEmployeeDocument(file: File, employeeId: string): Promise<{ filePath: string; fileSize: number; mimeType: string }> {
  // Validate file type
  if (!EMPLOYEE_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: PDF, Word, JPEG, PNG, GIF');
  }

  // Validate file size
  if (file.size > EMPLOYEE_MAX_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  const ext = path.extname(file.name).toLowerCase();

  // Validate extension matches mime type
  if (!MIME_TO_EXT[file.type] || !MIME_TO_EXT[file.type].includes(ext)) {
    throw new Error('Invalid file extension matching the file type.');
  }

  const filename = `${nanoid()}${ext}`;
  const key = `employees/${employeeId}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Try R2
  if (s3Client && R2_BUCKET_NAME) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
    return {
      filePath: key,
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  // Fallback local
  const uploadDir = path.join(UPLOAD_DIR, 'employees', employeeId);
  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  return {
    filePath: `employees/${employeeId}/${filename}`,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function deleteEmployeeDocument(filePath: string): Promise<void> {
  if (s3Client && R2_BUCKET_NAME) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filePath, // filePath is the key in R2 (e.g. employees/123/file.pdf)
        })
      );
    } catch (e) { console.error(e) }
  }

  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // Ignore
  }
}

export async function getEmployeeDocumentPath(filePath: string): Promise<string | null> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await fs.access(fullPath);
    return fullPath;
  } catch {
    return null;
  }
}
