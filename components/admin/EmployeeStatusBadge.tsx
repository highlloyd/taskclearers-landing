const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  terminated: 'Terminated',
};

interface EmployeeStatusBadgeProps {
  status: string;
}

export default function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export { statusColors, statusLabels };
