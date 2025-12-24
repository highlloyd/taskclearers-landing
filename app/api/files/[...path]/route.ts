import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFilePath, getFileStream } from '@/lib/upload';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.resolve('./uploads');

// Security: Validate filename to prevent path traversal attacks
function isValidFilename(filename: string): boolean {
  // Reject empty filenames
  if (!filename || filename.length === 0) return false;

  // Reject if contains path traversal sequences (including URL-encoded)
  const decodedFilename = decodeURIComponent(filename);
  if (decodedFilename.includes('..') || filename.includes('..')) return false;

  // Reject absolute paths
  if (path.isAbsolute(filename) || path.isAbsolute(decodedFilename)) return false;

  // Reject null bytes (used in some path traversal attacks)
  if (filename.includes('\0') || decodedFilename.includes('\0')) return false;

  // Only allow alphanumeric, dash, underscore, dot, and forward slash
  // This prevents unicode tricks and other special characters
  if (!/^[a-zA-Z0-9\-_./]+$/.test(filename)) return false;

  // Verify resolved path stays within UPLOAD_DIR
  const resolvedPath = path.resolve(UPLOAD_DIR, decodedFilename);
  if (!resolvedPath.startsWith(UPLOAD_DIR + path.sep) && resolvedPath !== UPLOAD_DIR) {
    return false;
  }

  return true;
}

interface Context {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, context: Context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path: pathParts } = await context.params;
    const filename = pathParts.join('/');

    // Security: Validate filename to prevent path traversal
    if (!isValidFilename(filename)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // 1. Try to find local file path first (Legacy/Fallback)
    const filepath = await getFilePath(filename);

    if (filepath) {
      const file = await fs.readFile(filepath);
      const ext = path.extname(filename).toLowerCase();

      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      // Check if inline viewing is requested (for PDF viewer)
      const url = new URL(request.url);
      const inline = url.searchParams.get('inline') === 'true';

      return new NextResponse(file, {
        headers: {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Content-Disposition': inline
            ? `inline; filename="${filename}"`
            : `attachment; filename="${filename}"`,
        },
      });
    }

    // 2. Try R2 if not found locally
    const r2Stream = await getFileStream(filename);
    if (r2Stream && r2Stream.stream) {
      const ext = path.extname(filename).toLowerCase();
      // Check if inline viewing is requested (for PDF viewer)
      const url = new URL(request.url);
      const inline = url.searchParams.get('inline') === 'true';

      // Convert web readable stream to node stream if necessary or return response directly
      // NextResponse accepts web streams.

      return new NextResponse(r2Stream.stream as BodyInit, {
        headers: {
          'Content-Type': r2Stream.contentType || 'application/octet-stream',
          'Content-Disposition': inline
            ? `inline; filename="${filename}"`
            : `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });

  } catch (error) {
    console.error('Failed to serve file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
