import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, employeeDocuments, adminUsers, employees } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logEmployeeActivity } from '@/lib/db/activity-logger';
import { saveEmployeeDocument, deleteEmployeeDocument } from '@/lib/upload';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;

    const documents = await db
      .select({
        id: employeeDocuments.id,
        name: employeeDocuments.name,
        type: employeeDocuments.type,
        filePath: employeeDocuments.filePath,
        fileSize: employeeDocuments.fileSize,
        mimeType: employeeDocuments.mimeType,
        description: employeeDocuments.description,
        expiresAt: employeeDocuments.expiresAt,
        createdAt: employeeDocuments.createdAt,
        uploadedByName: adminUsers.name,
        uploadedByEmail: adminUsers.email,
      })
      .from(employeeDocuments)
      .leftJoin(adminUsers, eq(employeeDocuments.uploadedBy, adminUsers.id))
      .where(eq(employeeDocuments.employeeId, id))
      .orderBy(desc(employeeDocuments.createdAt));

    return NextResponse.json(documents);
  } catch (err) {
    console.error('Failed to fetch documents:', err);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;

    // Verify employee exists
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const type = formData.get('type') as string | null;
    const description = formData.get('description') as string | null;
    const expiresAt = formData.get('expiresAt') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
    }

    const validTypes = ['contract', 'id_document', 'tax_form', 'certification', 'other'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Save file
    const { filePath, fileSize, mimeType } = await saveEmployeeDocument(file, id);

    const documentId = nanoid();
    await db.insert(employeeDocuments).values({
      id: documentId,
      employeeId: id,
      name: name.trim(),
      type,
      filePath,
      fileSize,
      mimeType,
      description: description?.trim() || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      uploadedBy: session!.user.id,
    });

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'document_uploaded',
      metadata: { documentId, type, name: name.trim() },
    });

    revalidatePath(`/admin/employees/${id}`);

    return NextResponse.json({ success: true, id: documentId });
  } catch (err) {
    console.error('Failed to upload document:', err);
    const message = err instanceof Error ? err.message : 'Failed to upload document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const [document] = await db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, documentId))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.employeeId !== id) {
      return NextResponse.json({ error: 'Document does not belong to this employee' }, { status: 403 });
    }

    // Delete file from storage
    await deleteEmployeeDocument(document.filePath);

    // Delete from database
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, documentId));

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'document_deleted',
      metadata: { type: document.type, name: document.name },
    });

    revalidatePath(`/admin/employees/${id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete document:', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
