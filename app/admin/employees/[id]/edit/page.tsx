'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
  hireDate: string;
  salary: { amount: number; currency: string; frequency: string } | null;
  address: { street: string; city: string; state: string; zip: string; country: string } | null;
  emergencyContact: { name: string; relationship: string; phone: string; email: string } | null;
  status: string;
}

export default function EditEmployeePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetch(`/api/admin/employees/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEmployee({
            ...data,
            hireDate: data.hireDate ? new Date(data.hireDate).toISOString().split('T')[0] : '',
          });
          // If there's address or emergency contact data, expand the advanced section
          if (data.address || data.emergencyContact) {
            setShowAdvanced(true);
          }
        }
      })
      .catch(() => setError('Failed to load employee'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Build salary object
    const salaryAmount = formData.get('salaryAmount');
    const salary = salaryAmount
      ? {
          amount: parseFloat(salaryAmount as string),
          currency: formData.get('salaryCurrency') || 'USD',
          frequency: formData.get('salaryFrequency') || 'annual',
        }
      : null;

    // Build address object
    const street = formData.get('street');
    const address = street
      ? {
          street: formData.get('street'),
          city: formData.get('city'),
          state: formData.get('state'),
          zip: formData.get('zip'),
          country: formData.get('country') || 'USA',
        }
      : null;

    // Build emergency contact object
    const emergencyName = formData.get('emergencyName');
    const emergencyContact = emergencyName
      ? {
          name: formData.get('emergencyName'),
          relationship: formData.get('emergencyRelationship'),
          phone: formData.get('emergencyPhone'),
          email: formData.get('emergencyEmail'),
        }
      : null;

    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      department: formData.get('department'),
      role: formData.get('role'),
      hireDate: formData.get('hireDate'),
      salary,
      address,
      emergencyContact,
    };

    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update employee');
      }

      router.push(`/admin/employees/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading employee...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">{error || 'Employee not found'}</div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/admin/employees/${id}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employee
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
          Edit {employee.firstName} {employee.lastName}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  defaultValue={employee.firstName}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  defaultValue={employee.lastName}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  defaultValue={employee.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  defaultValue={employee.phone || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  id="department"
                  required
                  defaultValue={employee.department}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role / Job Title *
                </label>
                <input
                  type="text"
                  name="role"
                  id="role"
                  required
                  defaultValue={employee.role}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Hire Date *
                </label>
                <input
                  type="date"
                  name="hireDate"
                  id="hireDate"
                  required
                  defaultValue={employee.hireDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Salary Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compensation</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="salaryAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Amount
                </label>
                <input
                  type="number"
                  name="salaryAmount"
                  id="salaryAmount"
                  step="0.01"
                  defaultValue={employee.salary?.amount || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="salaryCurrency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="salaryCurrency"
                  id="salaryCurrency"
                  defaultValue={employee.salary?.currency || 'USD'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <label htmlFor="salaryFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  name="salaryFrequency"
                  id="salaryFrequency"
                  defaultValue={employee.salary?.frequency || 'annual'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Section (collapsible) */}
          <div className="bg-white rounded-lg shadow">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <span className="text-lg font-semibold text-gray-900">Additional Information</span>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 space-y-6">
                {/* Address */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Address</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="street"
                      placeholder="Street Address"
                      defaultValue={employee.address?.street || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        defaultValue={employee.address?.city || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        defaultValue={employee.address?.state || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      />
                      <input
                        type="text"
                        name="zip"
                        placeholder="ZIP Code"
                        defaultValue={employee.address?.zip || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      name="country"
                      placeholder="Country"
                      defaultValue={employee.address?.country || 'USA'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="emergencyName"
                      placeholder="Contact Name"
                      defaultValue={employee.emergencyContact?.name || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                    <input
                      type="text"
                      name="emergencyRelationship"
                      placeholder="Relationship"
                      defaultValue={employee.emergencyContact?.relationship || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                    <input
                      type="tel"
                      name="emergencyPhone"
                      placeholder="Phone"
                      defaultValue={employee.emergencyContact?.phone || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                    <input
                      type="email"
                      name="emergencyEmail"
                      placeholder="Email"
                      defaultValue={employee.emergencyContact?.email || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/admin/employees/${id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
