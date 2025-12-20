'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import ApplicationCard, { ApplicationData } from './ApplicationCard';
import { statusColors, statusLabels } from './StatusBadge';

const STATUSES = ['new', 'reviewing', 'interviewed', 'offered', 'hired', 'rejected'];

const columnColors: Record<string, string> = {
  new: 'border-t-blue-500',
  reviewing: 'border-t-yellow-500',
  interviewed: 'border-t-purple-500',
  offered: 'border-t-green-500',
  hired: 'border-t-emerald-500',
  rejected: 'border-t-red-500',
};

interface KanbanColumnProps {
  status: string;
  applications: ApplicationData[];
}

function KanbanColumn({ status, applications }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[280px] bg-gray-50 rounded-lg border-t-4 ${columnColors[status]} ${
        isOver ? 'bg-gray-100' : ''
      }`}
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{statusLabels[status]}</h3>
          <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
            {applications.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No applications
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  applications: ApplicationData[];
  onStatusChange: (applicationId: string, newStatus: string) => Promise<void>;
}

export default function KanbanBoard({ applications, onStatusChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localApplications, setLocalApplications] = useState(applications);

  // Sync local state when parent props change (e.g., after API updates)
  useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const activeApplication = activeId
    ? localApplications.find((a) => a.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeApp = localApplications.find((a) => a.id === active.id);
    if (!activeApp) return;

    // Check if we're over a column (status) or another card
    const overId = over.id as string;
    const overStatus = STATUSES.includes(overId)
      ? overId
      : localApplications.find((a) => a.id === overId)?.status;

    if (overStatus && activeApp.status !== overStatus) {
      setLocalApplications((apps) =>
        apps.map((app) =>
          app.id === active.id ? { ...app, status: overStatus } : app
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeApp = localApplications.find((a) => a.id === active.id);
    const originalApp = applications.find((a) => a.id === active.id);

    if (!activeApp || !originalApp) return;

    // If status changed, update via API
    if (activeApp.status !== originalApp.status) {
      try {
        await onStatusChange(activeApp.id, activeApp.status);
      } catch (error) {
        // Revert on error
        setLocalApplications((apps) =>
          apps.map((app) =>
            app.id === active.id ? { ...app, status: originalApp.status } : app
          )
        );
      }
    }
  };

  // Group applications by status
  const applicationsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = localApplications.filter((a) => a.status === status);
    return acc;
  }, {} as Record<string, ApplicationData[]>);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={applicationsByStatus[status]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApplication && (
          <ApplicationCard application={activeApplication} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
