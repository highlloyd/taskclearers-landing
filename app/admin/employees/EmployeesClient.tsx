'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, X, Mail, Phone, Calendar } from 'lucide-react';
import EmployeeStatusBadge from '@/components/admin/EmployeeStatusBadge';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
  hireDate: Date | null;
  status: string;
  createdAt: Date | null;
  jobTitle: string | null;
}

interface EmployeesClientProps {
  initialEmployees: Employee[];
  departments: string[];
}

export default function EmployeesClient({ initialEmployees, departments }: EmployeesClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const filteredEmployees = useMemo(() => {
    return initialEmployees.filter((employee) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          employee.firstName.toLowerCase().includes(searchLower) ||
          employee.lastName.toLowerCase().includes(searchLower) ||
          employee.email.toLowerCase().includes(searchLower) ||
          employee.role.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && employee.status !== statusFilter) return false;

      // Department filter
      if (departmentFilter && employee.department !== departmentFilter) return false;

      return true;
    });
  }, [initialEmployees, search, statusFilter, departmentFilter]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
  };

  const hasFilters = search || statusFilter || departmentFilter;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <Link
          href="/admin/employees/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900">{initialEmployees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {initialEmployees.filter(e => e.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">On Leave</p>
          <p className="text-2xl font-bold text-yellow-600">
            {initialEmployees.filter(e => e.status === 'on_leave').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Departments</p>
          <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {hasFilters ? (
                      <>No employees match your filters. <button onClick={clearFilters} className="text-green-600 hover:text-green-700">Clear filters</button></>
                    ) : (
                      <>No employees yet. <Link href="/admin/employees/new" className="text-green-600 hover:text-green-700">Add your first employee</Link></>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/employees/${employee.id}`} className="block">
                        <p className="font-medium text-gray-900 hover:text-green-600">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </span>
                          {employee.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {employee.phone}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {employee.role}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {employee.hireDate?.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <EmployeeStatusBadge status={employee.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/employees/${employee.id}`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
