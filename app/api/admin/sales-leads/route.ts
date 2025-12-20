import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, salesLeads, adminUsers } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logSalesLeadActivity } from '@/lib/db/sales-lead-activity-logger';
import { eq, desc, like, or, and, isNotNull } from 'drizzle-orm';

export async function GET(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_SALES_LEADS);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');

    // Build conditions
    const conditions = [];

    if (stage) {
      conditions.push(eq(salesLeads.stage, stage));
    }

    if (source) {
      conditions.push(eq(salesLeads.source, source));
    }

    if (assignedTo) {
      conditions.push(eq(salesLeads.assignedTo, assignedTo));
    }

    if (search) {
      conditions.push(
        or(
          like(salesLeads.companyName, `%${search}%`),
          like(salesLeads.contactName, `%${search}%`),
          like(salesLeads.contactEmail, `%${search}%`)
        )
      );
    }

    const result = await db
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
        assignedToName: adminUsers.name,
        assignedToEmail: adminUsers.email,
      })
      .from(salesLeads)
      .leftJoin(adminUsers, eq(salesLeads.assignedTo, adminUsers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(salesLeads.createdAt));

    // Get unique sources and stages for filter dropdowns
    const sources = await db
      .selectDistinct({ source: salesLeads.source })
      .from(salesLeads)
      .where(isNotNull(salesLeads.source))
      .orderBy(salesLeads.source);

    const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

    return NextResponse.json({
      leads: result,
      sources: sources.map((s) => s.source).filter(Boolean),
      stages,
    });
  } catch (err) {
    console.error('Failed to fetch sales leads:', err);
    return NextResponse.json({ error: 'Failed to fetch sales leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_SALES_LEADS);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      stage = 'new',
      estimatedValue,
      currency = 'USD',
      source,
      assignedTo,
    } = body;

    // Validate required fields
    if (!companyName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactName, contactEmail' },
        { status: 400 }
      );
    }

    // Validate stage
    const validStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStages.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    const leadId = nanoid();
    await db.insert(salesLeads).values({
      id: leadId,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone?.trim() || null,
      stage,
      estimatedValue: estimatedValue || null,
      currency: currency || 'USD',
      source: source?.trim() || null,
      assignedTo: assignedTo || null,
      createdBy: session!.user.id,
    });

    // Log activity
    await logSalesLeadActivity({
      leadId,
      adminUserId: session!.user.id,
      action: 'created',
      metadata: {
        source: source || undefined,
        assignedTo: assignedTo || undefined,
      },
    });

    revalidatePath('/admin/sales-leads');

    return NextResponse.json({ success: true, id: leadId });
  } catch (err) {
    console.error('Failed to create sales lead:', err);
    return NextResponse.json({ error: 'Failed to create sales lead' }, { status: 500 });
  }
}
