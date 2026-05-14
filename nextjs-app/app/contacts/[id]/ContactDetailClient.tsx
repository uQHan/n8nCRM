'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { ContactUpdateRequest, ProcessedContactRow } from '@/types';

const backendBaseUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

function normalizeInput(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? '' : trimmed;
}

function buildUpdateRequest(form: ContactUpdateRequest): ContactUpdateRequest {
  const next: ContactUpdateRequest = {};
  for (const [key, raw] of Object.entries(form)) {
    if (raw === undefined) continue;
    if (raw === null) {
      next[key as keyof ContactUpdateRequest] = null;
      continue;
    }
    const value = typeof raw === 'string' ? normalizeInput(raw) : raw;
    // send empty string to explicitly clear (backend turns blank -> null)
    next[key as keyof ContactUpdateRequest] = value as any;
  }
  return next;
}

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

export default function ContactDetailClient({ initialContact }: { initialContact: ProcessedContactRow }) {
  const router = useRouter();
  const [contact, setContact] = useState<ProcessedContactRow>(initialContact);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ContactUpdateRequest>(() => ({
    name: initialContact.name ?? '',
    email: initialContact.email ?? '',
    phone: initialContact.phone ?? '',
    company: initialContact.company ?? '',
    title: initialContact.title ?? '',
    address: initialContact.address ?? '',
    city: initialContact.city ?? '',
    state: initialContact.state ?? '',
    country: initialContact.country ?? '',
    zip: initialContact.zip ?? '',
    website: initialContact.website ?? '',
    company_domain: initialContact.company_domain ?? '',
    company_size: initialContact.company_size ?? '',
    company_industry: initialContact.company_industry ?? '',
    company_location: initialContact.company_location ?? '',
    phone_formatted: initialContact.phone_formatted ?? '',
  }));

  const id = contact.id;

  const canDelete = useMemo(() => Boolean(id) && !deleting, [id, deleting]);

  async function saveEdits() {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${backendBaseUrl}/api/contacts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildUpdateRequest(form)),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message = payload?.error || `Failed to update contact (${res.status})`;
        throw new Error(message);
      }

      const updated = (await res.json()) as ProcessedContactRow;
      setContact(updated);
      setEditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact() {
    if (!id) return;
    if (!confirm('Delete this contact? This cannot be undone.')) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${backendBaseUrl}/api/contacts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.status === 204) {
        router.push('/contacts');
        return;
      }

      const payload = await res.json().catch(() => null);
      const message = payload?.error || `Failed to delete contact (${res.status})`;
      throw new Error(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={deleteContact}
          disabled={!canDelete}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Contact</h3>
              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
