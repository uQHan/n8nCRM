'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ContactUpdateRequest,
  ContactSearchResponse,
  ContactSummary,
  ProcessedContactRow,
} from '@/types';

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</div>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </label>
  );
}

function buildUpdateRequest(form: ContactUpdateRequest): ContactUpdateRequest {
  const next: ContactUpdateRequest = {};
  for (const [key, raw] of Object.entries(form)) {
    if (raw === undefined) continue;
    if (raw === null) {
      next[key as keyof ContactUpdateRequest] = null;
      continue;
    }
    if (typeof raw === 'string') {
      next[key as keyof ContactUpdateRequest] = raw;
      continue;
    }
    next[key as keyof ContactUpdateRequest] = raw as any;
  }
  return next;
}

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [deliverableOnly, setDeliverableOnly] = useState(false);
  const [enrichedOnly, setEnrichedOnly] = useState(false);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [refreshCounter, setRefreshCounter] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState<ContactUpdateRequest>({});

  const debounceRef = useRef<number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  useEffect(() => {
    setLoadingContacts(true);
    setError(null);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        params.set('deliverableOnly', String(deliverableOnly));
        params.set('enrichedOnly', String(enrichedOnly));
        params.set('duplicatesOnly', String(duplicatesOnly));
        params.set('page', String(page));
        params.set('size', String(size));

        const res = await fetch(`/api/contacts?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load contacts (${res.status})`);
        }
        const data = (await res.json()) as ContactSearchResponse;
        setContacts(data.items || []);
        setTotal(data.total || 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, deliverableOnly, enrichedOnly, duplicatesOnly, page, size, refreshCounter]);

  async function openEdit(id: string) {
    setEditError(null);
    setEditOpen(true);
    setEditLoading(true);
    setEditingId(id);
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Failed to load contact (${res.status})`);
      const detail = (await res.json()) as ProcessedContactRow;
      setForm({
        name: detail.name ?? '',
        email: detail.email ?? '',
        phone: detail.phone ?? '',
        company: detail.company ?? '',
        title: detail.title ?? '',
        address: detail.address ?? '',
        city: detail.city ?? '',
        state: detail.state ?? '',
        country: detail.country ?? '',
        zip: detail.zip ?? '',
        website: detail.website ?? '',
        company_domain: detail.company_domain ?? '',
        company_size: detail.company_size ?? '',
        company_industry: detail.company_industry ?? '',
        company_location: detail.company_location ?? '',
        phone_formatted: detail.phone_formatted ?? '',
      });
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to load contact');
    } finally {
      setEditLoading(false);
    }
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(editingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildUpdateRequest(form)),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message = payload?.error || `Failed to update (${res.status})`;
        throw new Error(message);
      }

      setEditOpen(false);
      setEditingId(null);
      setRefreshCounter((c) => c + 1);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        setRefreshCounter((c) => c + 1);
        return;
      }
      const payload = await res.json().catch(() => null);
      const message = payload?.error || `Failed to delete (${res.status})`;
      throw new Error(message);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete contact');
    }
  }

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };
  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              CRM Data Cleaner
            </Link>
            <nav className="flex space-x-4 text-sm">
              <Link
                href="/contacts"
                className="font-semibold text-gray-900 dark:text-gray-100"
                aria-current="page"
              >
                Contacts
              </Link>
              <Link
                href="/email"
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-semibold"
              >
                Send Email
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-10 px-6 max-w-6xl space-y-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main List Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customer Contacts</h2>
            
            {/* Filters & Search */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-50">
                <label className="sr-only">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email or company..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={deliverableOnly}
                    onChange={(e) => {
                      setDeliverableOnly(e.target.checked);
                      setPage(0);
                    }}
                  />
                  Deliverable Emails Only
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={enrichedOnly}
                    onChange={(e) => {
                      setEnrichedOnly(e.target.checked);
                      setPage(0);
                    }}
                  />
                  Enriched Only
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={duplicatesOnly}
                    onChange={(e) => {
                      setDuplicatesOnly(e.target.checked);
                      setPage(0);
                    }}
                  />
                  Duplicates Only
                </label>
                
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative min-h-75">
              {loadingContacts && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-700 w-full text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Deliverable</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{contact.name || '-'}</td>
                      <td className="px-4 py-3">{contact.email}</td>
                      <td className="px-4 py-3">{contact.company || '-'}</td>
                      <td className="px-4 py-3">
                        {contact.email_deliverable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No/Unk</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openEdit(contact.id)}
                            className="text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && !loadingContacts && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No contacts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {contacts.length > 0 ? page * size + 1 : 0} to {Math.min((page + 1) * size, total)} of {total} Contacts
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 0 || loadingContacts}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Previous
                </button>
                <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium leading-none flex items-center">
                  {page + 1} / {totalPages}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={page >= totalPages - 1 || loadingContacts}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>

        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Contact</h3>
                <button
                  onClick={() => {
                    setEditOpen(false);
                    setEditingId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {editError && (
                <div className="px-6 pt-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">{editError}</p>
                  </div>
                </div>
              )}

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {editLoading ? (
                  <div className="col-span-full py-10 flex justify-center">
                    <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <Field label="Name" value={String(form.name ?? '')} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
                    <Field label="Email" required value={String(form.email ?? '')} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
                    <Field label="Phone" value={String(form.phone ?? '')} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                    <Field label="Phone (formatted)" value={String(form.phone_formatted ?? '')} onChange={(v) => setForm((p) => ({ ...p, phone_formatted: v }))} />
                    <Field label="Company" value={String(form.company ?? '')} onChange={(v) => setForm((p) => ({ ...p, company: v }))} />
                    <Field label="Title" value={String(form.title ?? '')} onChange={(v) => setForm((p) => ({ ...p, title: v }))} />
                    <Field label="Address" value={String(form.address ?? '')} onChange={(v) => setForm((p) => ({ ...p, address: v }))} />
                    <Field label="City" value={String(form.city ?? '')} onChange={(v) => setForm((p) => ({ ...p, city: v }))} />
                    <Field label="State" value={String(form.state ?? '')} onChange={(v) => setForm((p) => ({ ...p, state: v }))} />
                    <Field label="Country" value={String(form.country ?? '')} onChange={(v) => setForm((p) => ({ ...p, country: v }))} />
                    <Field label="ZIP" value={String(form.zip ?? '')} onChange={(v) => setForm((p) => ({ ...p, zip: v }))} />
                    <Field label="Website" value={String(form.website ?? '')} onChange={(v) => setForm((p) => ({ ...p, website: v }))} />
                    <Field label="Company domain" value={String(form.company_domain ?? '')} onChange={(v) => setForm((p) => ({ ...p, company_domain: v }))} />
                    <Field label="Company size" value={String(form.company_size ?? '')} onChange={(v) => setForm((p) => ({ ...p, company_size: v }))} />
                    <Field label="Company industry" value={String(form.company_industry ?? '')} onChange={(v) => setForm((p) => ({ ...p, company_industry: v }))} />
                    <Field label="Company location" value={String(form.company_location ?? '')} onChange={(v) => setForm((p) => ({ ...p, company_location: v }))} />
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditOpen(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || editLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}