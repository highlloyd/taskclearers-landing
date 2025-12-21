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
import SalesLeadCard, { SalesLeadData } from './SalesLeadCard';
import { stageLabels } from './SalesLeadStatusBadge';

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const columnColors: Record<string, string> = {
  new: 'border-t-blue-500',
  contacted: 'border-t-sky-500',
  qualified: 'border-t-yellow-500',
  proposal: 'border-t-purple-500',
  negotiation: 'border-t-orange-500',
  won: 'border-t-emerald-500',
  lost: 'border-t-red-500',
};

interface KanbanColumnProps {
  stage: string;
  leads: SalesLeadData[];
  totalValue: number;
  currency: string;
}

function KanbanColumn({ stage, leads, totalValue, currency }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const formatCurrency = (value: number, curr: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[260px] w-[260px] md:min-w-[280px] md:w-[280px] bg-gray-50 rounded-lg border-t-4 snap-start ${columnColors[stage]} ${
        isOver ? 'bg-gray-100' : ''
      }`}
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{stageLabels[stage]}</h3>
          <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(totalValue, currency)}
          </p>
        )}
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[50vh] md:max-h-[calc(100vh-280px)]">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <SalesLeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No leads
          </div>
        )}
      </div>
    </div>
  );
}

interface SalesLeadKanbanBoardProps {
  leads: SalesLeadData[];
  onStageChange: (leadId: string, newStage: string) => Promise<void>;
}

export default function SalesLeadKanbanBoard({ leads, onStageChange }: SalesLeadKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localLeads, setLocalLeads] = useState(leads);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const activeLead = activeId
    ? localLeads.find((l) => l.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeLead = localLeads.find((l) => l.id === active.id);
    if (!activeLead) return;

    const overId = over.id as string;
    const overStage = STAGES.includes(overId)
      ? overId
      : localLeads.find((l) => l.id === overId)?.stage;

    if (overStage && activeLead.stage !== overStage) {
      setLocalLeads((leads) =>
        leads.map((lead) =>
          lead.id === active.id ? { ...lead, stage: overStage } : lead
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLead = localLeads.find((l) => l.id === active.id);
    const originalLead = leads.find((l) => l.id === active.id);

    if (!activeLead || !originalLead) return;

    if (activeLead.stage !== originalLead.stage) {
      try {
        await onStageChange(activeLead.id, activeLead.stage);
      } catch (error) {
        setLocalLeads((leads) =>
          leads.map((lead) =>
            lead.id === active.id ? { ...lead, stage: originalLead.stage } : lead
          )
        );
      }
    }
  };

  // Group leads by stage
  const leadsByStage = STAGES.reduce((acc, stage) => {
    const stageLeads = localLeads.filter((l) => l.stage === stage);
    const totalValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    acc[stage] = { leads: stageLeads, totalValue };
    return acc;
  }, {} as Record<string, { leads: SalesLeadData[]; totalValue: number }>);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-pl-4 -mx-4 px-4 md:mx-0 md:px-0">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={leadsByStage[stage].leads}
            totalValue={leadsByStage[stage].totalValue}
            currency="USD"
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead && (
          <SalesLeadCard lead={activeLead} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
