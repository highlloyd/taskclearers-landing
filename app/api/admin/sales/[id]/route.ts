import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, salesLeads, adminUsers, salesLeadNotes, salesLeadActivityLog } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logSalesLeadActivity, logSalesLeadFieldChanges } from '@/lib/db/activity-logger';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_SALES_LEADS);
  if (error) return error;

  try {
    const { id } = await context.params;

    const [lead] = await db
      .select({
        id: salesLeads.id,
        companyName: salesLeads.companyName,
        contactName: salesLeads.contactName,
        contactEmail: salesLeads.contactEmail,
        contactPhone: salesLeads.contactPhone,
        stage: salesLeads.stage,
        estimatedValue: salesLeads.estimatedValue,
        currency: salesLeads.currency,
        source: salesLeads.source,
        assignedTo: salesLeads.assignedTo,
        wonDate: salesLeads.wonDate,
        lostDate: salesLeads.lostDate,
        lostReason: salesLeads.lostReason,
        createdAt: salesLeads.createdAt,
        updatedAt: salesLeads.updatedAt,
        createdBy: salesLeads.createdBy,
        assignedToName: adminUsers.name,
        assignedToEmail: adminUsers.email,
      })
      .from(salesLeads)
      .leftJoin(adminUsers, eq(salesLeads.assignedTo, adminUsers.id))
      .where(eq(salesLeads.id, id))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: 'Sales lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (err) {
    console.error('Failed to fetch sales lead:', err);
    return NextResponse.json({ error: 'Failed to fetch sales lead' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_SALES_LEADS);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();

    // Fetch current lead data for comparison
    const [current] = await db
      .select()
      .from(salesLeads)
      .where(eq(salesLeads.id, id))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: 'Sales lead not found' }, { status: 404 });
    }

    // Build update object and track changes
    const updates: Record<string, unknown> = {};
    const changes: Array<{ field: string; previousValue: unknown; newValue: unknown }> = [];

    const fields = [
      'companyName', 'contactName', 'contactEmail', 'contactPhone',
      'stage', 'estimatedValue', 'currency', 'source', 'assignedTo',
      'lostReason'
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        let newValue = body[field];
        let oldValue = current[field as keyof typeof current];

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          updates[field] = newValue;

          // Special handling for stage changes
          if (field === 'stage') {
            // Set won/lost dates
            if (newValue === 'won') {
              updates.wonDate = new Date();
              updates.lostDate = null;
              updates.lostReason = null;
            } else if (newValue === 'lost') {
              updates.lostDate = new Date();
              updates.wonDate = null;
              if (body.lostReason) {
                updates.lostReason = body.lostReason;
              }
            } else {
              // Moving back to active stage
              updates.wonDate = null;
              updates.lostDate = null;
              updates.lostReason = null;
            }

            await logSalesLeadActivity({
              leadId: id,
              adminUserId: session!.user.id,
              action: 'stage_changed',
              previousValue: oldValue,
              newValue: newValue,
              metadata: newValue === 'lost' ? { lostReason: body.lostReason } : undefined,
            });
          } else {
            changes.push({
              field,
              previousValue: oldValue,
              newValue: newValue,
            });
          }
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes detected' });
    }

    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();

    await db.update(salesLeads).set(updates).where(eq(salesLeads.id, id));

    // Log field changes
    if (changes.length > 0) {
      await logSalesLeadFieldChanges(id, session!.user.id, changes);
    }

    revalidatePath(`/admin/sales/${id}`);
    revalidatePath('/admin/sales');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update sales lead:', err);
    return NextResponse.json({ error: 'Failed to update sales lead' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_SALES_LEADS);
  if (error) return error;

  try {
    const { id } = await context.params;

    const [lead] = await db
      .select()
      .from(salesLeads)
      .where(eq(salesLeads.id, id))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: 'Sales lead not found' }, { status: 404 });
    }

    // Hard delete - cascade will remove notes and activity
    await db.delete(salesLeads).where(eq(salesLeads.id, id));

    revalidatePath('/admin/sales');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete sales lead:', err);
    return NextResponse.json({ error: 'Failed to delete sales lead' }, { status: 500 });
  }
}
