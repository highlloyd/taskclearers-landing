import { nanoid } from 'nanoid';
import { db, salesLeadActivityLog } from './index';

export type SalesLeadActivityAction =
  | 'created'
  | 'updated'
  | 'stage_changed'
  | 'note_added'
  | 'note_updated'
  | 'note_deleted'
  | 'email_sent';

interface LogActivityParams {
  leadId: string;
  adminUserId: string;
  action: SalesLeadActivityAction;
  field?: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

export async function logSalesLeadActivity({
  leadId,
  adminUserId,
  action,
  field,
  previousValue,
  newValue,
  metadata,
}: LogActivityParams): Promise<void> {
  await db.insert(salesLeadActivityLog).values({
    id: nanoid(),
    leadId,
    adminUserId,
    action,
    field,
    previousValue: previousValue !== undefined ? JSON.stringify(previousValue) : null,
    newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

// Helper to log multiple field changes at once
export async function logSalesLeadFieldChanges(
  leadId: string,
  adminUserId: string,
  changes: Array<{ field: string; previousValue: unknown; newValue: unknown }>
): Promise<void> {
  for (const change of changes) {
    await logSalesLeadActivity({
      leadId,
      adminUserId,
      action: 'updated',
      field: change.field,
      previousValue: change.previousValue,
      newValue: change.newValue,
    });
  }
}
