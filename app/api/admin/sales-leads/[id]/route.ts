import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, salesLeads, adminUsers } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logSalesLeadActivity, logSalesLeadFieldChanges } from '@/lib/db/sales-lead-activity-logger';
import { eq } from 'drizzle-orm';

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

    // Get creator info
    let createdByInfo = null;
    if (lead.createdBy) {
      const [creator] = await db
        .select({ name: adminUsers.name, email: adminUsers.email })
        .from(adminUsers)
        .where(eq(adminUsers.id, lead.createdBy))
        .limit(1);
      createdByInfo = creator || null;
    }

    return NextResponse.json({
      ...lead,
      createdByName: createdByInfo?.name,
      createdByEmail: createdByInfo?.email,
    });
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
      'wonDate', 'lostDate', 'lostReason'
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        let newValue = body[field];
        const oldValue = current[field as keyof typeof current];

        // Handle date fields
        if (['wonDate', 'lostDate'].includes(field) && newValue) {
          newValue = new Date(newValue);
        }

        // Handle null/empty values
        if (newValue === '' || newValue === null) {
          newValue = null;
        }

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          updates[field] = newValue;

          // Special handling for stage changes
          if (field === 'stage') {
            await logSalesLeadActivity({
              leadId: id,
              adminUserId: session!.user.id,
              action: 'stage_changed',
              previousValue: oldValue,
              newValue: body[field],
            });

            // Auto-set won/lost dates
            if (body[field] === 'won' && !current.wonDate) {
              updates.wonDate = new Date();
            } else if (body[field] === 'lost' && !current.lostDate) {
              updates.lostDate = new Date();
            }
          } else {
            changes.push({
              field,
              previousValue: oldValue,
              newValue: body[field],
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

    revalidatePath(`/admin/sales-leads/${id}`);
    revalidatePath('/admin/sales-leads');

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

    // Hard delete the sales lead (cascade will handle related records)
    await db.delete(salesLeads).where(eq(salesLeads.id, id));

    revalidatePath('/admin/sales-leads');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete sales lead:', err);
    return NextResponse.json({ error: 'Failed to delete sales lead' }, { status: 500 });
  }
}
