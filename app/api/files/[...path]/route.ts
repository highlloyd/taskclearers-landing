import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFilePath } from '@/lib/upload';
import fs from 'fs/promises';
import path from 'path';

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

    // Security: Only allow accessing files in uploads directory
    if (filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filepath = await getFilePath(filename);

    if (!filepath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

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
  } catch (error) {
    console.error('Failed to serve file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
