'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export interface ApplicationData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date | null;
  jobId: string;
  jobTitle: string | null;
  hasReply?: boolean;
}

interface ApplicationCardProps {
  application: ApplicationData;
  isDragging?: boolean;
}

export default function ApplicationCard({ application, isDragging }: ApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${application.hasReply ? 'ring-2 ring-blue-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-gray-900 text-sm truncate">
              {application.firstName} {application.lastName}
            </p>
            {application.hasReply && (
              <span className="flex-shrink-0" title="Has replied">
                <MessageCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{application.email}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {application.jobTitle && (
        <p className="text-xs text-gray-600 mb-2 truncate">
          {application.jobTitle}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {application.createdAt?.toLocaleDateString()}
        </span>
        <Link
          href={`/admin/applications/${application.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-green-600 hover:text-green-700 font-medium"
        >
          View
        </Link>
      </div>
    </div>
  );
}
