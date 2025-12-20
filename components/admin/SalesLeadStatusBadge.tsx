const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-sky-100 text-sky-800',
  qualified: 'bg-yellow-100 text-yellow-800',
  proposal: 'bg-purple-100 text-purple-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
};

const stageLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

interface SalesLeadStatusBadgeProps {
  stage: string;
}

export default function SalesLeadStatusBadge({ stage }: SalesLeadStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors[stage] || 'bg-gray-100 text-gray-800'}`}>
      {stageLabels[stage] || stage}
    </span>
  );
}

export { stageColors, stageLabels };
