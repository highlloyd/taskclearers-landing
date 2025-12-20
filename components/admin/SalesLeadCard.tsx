'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Building, DollarSign, User } from 'lucide-react';
import SalesLeadStatusBadge from './SalesLeadStatusBadge';

export interface SalesLeadData {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  stage: string;
  estimatedValue: number | null;
  currency: string | null;
  source: string | null;
  assignedToName: string | null;
  createdAt: Date | null;
}

interface SalesLeadCardProps {
  lead: SalesLeadData;
  isDragging?: boolean;
}

export default function SalesLeadCard({ lead, isDragging }: SalesLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <p className="font-medium text-gray-900 text-sm truncate">
              {lead.companyName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500 truncate">{lead.contactName}</p>
          </div>
        </div>
        <SalesLeadStatusBadge stage={lead.stage} />
      </div>

      {lead.estimatedValue && (
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign className="w-3.5 h-3.5 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            {formatCurrency(lead.estimatedValue, lead.currency || 'USD')}
          </span>
        </div>
      )}

      {lead.source && (
        <p className="text-xs text-gray-500 mb-2">
          Source: {lead.source}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {lead.createdAt?.toLocaleDateString()}
        </span>
        <Link
          href={`/admin/sales/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-green-600 hover:text-green-700 font-medium"
        >
          View
        </Link>
      </div>
    </div>
  );
}
