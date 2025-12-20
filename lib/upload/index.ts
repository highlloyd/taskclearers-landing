import { nanoid } from 'nanoid';
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

export async function saveFile(file: File): Promise<string> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF file.');
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Ensure upload directory exists
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.name);
  const filename = `${nanoid()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return filename;
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filepath);
  } catch {
    // File might not exist, ignore error
  }
}

export async function getFilePath(filename: string): Promise<string | null> {
  const filepath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.access(filepath);
    return filepath;
  } catch {
    return null;
  }
}

// Employee document functions
export async function saveEmployeeDocument(file: File, employeeId: string): Promise<{ filePath: string; fileSize: number; mimeType: string }> {
  // Validate file type
  if (!EMPLOYEE_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: PDF, Word, JPEG, PNG, GIF');
  }

  // Validate file size
  if (file.size > EMPLOYEE_MAX_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  // Create employee-specific subdirectory
  const uploadDir = path.join(UPLOAD_DIR, 'employees', employeeId);
  await fs.mkdir(uploadDir, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.name);
  const filename = `${nanoid()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return {
    filePath: `employees/${employeeId}/${filename}`,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function deleteEmployeeDocument(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // File might not exist, ignore error
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
