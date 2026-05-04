'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ContactSearchResponse,
  ContactSummary,
  EmailPlaceholdersResponse,
  EmailPreviewResponse,
  EmailSendResponse,
} from '@/types';

const backendBaseUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function EmailPage() {
  const [query, setQuery] = useState('');
  const [deliverableOnly, setDeliverableOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [subjectTemplate, setSubjectTemplate] = useState('Hello [cname]');
  const [bodyTemplate, setBodyTemplate] = useState(
    'Hi [cname],\n\nI’m reaching out from [ccompany].\n\nBest regards,\n'
  );
  const [isHtml, setIsHtml] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'SMTP' | 'N8N'>('SMTP');

  const [placeholders, setPlaceholders] = useState<EmailPlaceholdersResponse['placeholders']>([]);

  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<EmailSendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);
  const allVisibleSelected = useMemo(() => {
    if (contacts.length === 0) return false;
    return contacts.every(c => selectedIds.has(c.id));
  }, [contacts, selectedIds]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/api/email/placeholders`);
        if (!res.ok) return;
        const data = (await res.json()) as EmailPlaceholdersResponse;
        setPlaceholders(data.placeholders || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    setLoadingContacts(true);
    setError(null);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = new URL(`${backendBaseUrl}/api/contacts`);
        if (query.trim()) url.searchParams.set('q', query.trim());
        url.searchParams.set('deliverableOnly', String(deliverableOnly));
        url.searchParams.set('page', String(page));
        url.searchParams.set('size', String(size));

        const res = await fetch(url.toString());
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
  }, [query, deliverableOnly, page, size]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const c of contacts) next.add(c.id);
      return next;
    });
  }

  function clearAllVisible() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const c of contacts) next.delete(c.id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function runPreview() {
    setError(null);
    setPreview(null);
    setSendResult(null);

    const firstId = Array.from(selectedIds)[0];
    if (!firstId) {
      setError('Select at least one customer to preview.');
      return;
    }

    try {
      const res = await fetch(`${backendBaseUrl}/api/email/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: firstId,
          subject_template: subjectTemplate,
          body_template: bodyTemplate,
        }),
      });
      if (!res.ok) {
        throw new Error(`Preview failed (${res.status})`);
      }
      const data = (await res.json()) as EmailPreviewResponse;
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    }
  }

  async function sendEmails(dryRun: boolean) {
    setError(null);
    setPreview(null);
    setSendResult(null);

    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setError('Select at least one customer to send to.');
      return;
    }

    if (!dryRun) {
      const ok = window.confirm(`Send email to ${ids.length} selected customer(s)?`);
      if (!ok) return;
    }

    setSending(true);
    try {
      const res = await fetch(`${backendBaseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: ids,
          subject_template: subjectTemplate,
          body_template: bodyTemplate,
          delivery_mode: deliveryMode,
          is_html: isHtml,
          dry_run: dryRun,
        }),
      });
      if (!res.ok) {
        throw new Error(`Send failed (${res.status})`);
      }
      const data = (await res.json()) as EmailSendResponse;
      setSendResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              CRM Data Cleaner
            </Link>
            <nav className="text-sm">
              <Link
                href="/email"
                className="font-semibold text-gray-900 dark:text-gray-100"
                aria-current="page"
              >
                Send Email
              </Link>
            </nav>
          </div>
          <div className="auth-placeholder"></div>
        </div>
      </header>

      <main className="container mx-auto py-10 px-6 max-w-6xl space-y-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Email Template</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Use placeholders like <span className="font-mono">[cname]</span> and{' '}
            <span className="font-mono">[ccompany]</span> (also supports{' '}
            <span className="font-mono">[ccompnay]</span>).
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Subject</span>
              <input
                value={subjectTemplate}
                onChange={e => setSubjectTemplate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Subject with placeholders"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Body</span>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={isHtml}
                    onChange={e => setIsHtml(e.target.checked)}
                    className="rounded"
                  />
                  Send as HTML
                </label>
              </div>
              <textarea
                value={bodyTemplate}
                onChange={e => setBodyTemplate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-40"
                placeholder="Email body with placeholders"
              />
            </label>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-200">
              <div className="font-medium">Delivery</div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryMode"
                  checked={deliveryMode === 'SMTP'}
                  onChange={() => setDeliveryMode('SMTP')}
                />
                SMTP (Spring Mail)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryMode"
                  checked={deliveryMode === 'N8N'}
                  onChange={() => setDeliveryMode('N8N')}
                />
                n8n webhook
              </label>
              {deliveryMode === 'N8N' && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  Requires <span className="font-mono">N8N_EMAIL_WEBHOOK_URL</span> on the backend.
                </span>
              )}
            </div>

            {placeholders.length > 0 && (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <div className="font-medium">Available placeholders</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {placeholders.map(p => (
                    <button
                      type="button"
                      key={p.token}
                      onClick={() => navigator.clipboard?.writeText(p.token)}
                      className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1 font-mono text-xs"
                      title="Click to copy"
                    >
                      {p.token}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runPreview}
                className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold"
              >
                Preview (first selected)
              </button>
              <button
                type="button"
                onClick={() => sendEmails(true)}
                disabled={sending}
                className={classNames(
                  'rounded-md border px-4 py-2 text-sm font-semibold',
                  sending
                    ? 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500'
                    : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/30'
                )}
              >
                Dry-run
              </button>
              <button
                type="button"
                onClick={() => sendEmails(false)}
                disabled={sending}
                className={classNames(
                  'rounded-md bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold',
                  sending && 'opacity-60'
                )}
              >
                {sending ? 'Sending…' : 'Send Emails'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setSendResult(null);
                  setError(null);
                }}
                className="rounded-md border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm"
              >
                Clear output
              </button>
            </div>

            {preview && (
              <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Preview to {preview.to_email}</div>
                <div className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                  <div className="font-semibold">Subject</div>
                  <div className="font-mono text-xs whitespace-pre-wrap">{preview.subject}</div>
                  <div className="mt-3 font-semibold">Body</div>
                  <div className="font-mono text-xs whitespace-pre-wrap">{preview.body}</div>
                </div>
              </div>
            )}

            {sendResult && (
              <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Result: {sendResult.success_count} sent, {sendResult.failure_count} failed
                </div>
                {sendResult.failure_count > 0 && (
                  <div className="mt-2 text-xs font-mono whitespace-pre-wrap text-red-700 dark:text-red-300">
                    {sendResult.results
                      .filter(r => !r.success)
                      .slice(0, 20)
                      .map(r => `${r.to_email || r.contact_id}: ${r.error || 'FAILED'}`)
                      .join('\n')}
                    {sendResult.results.filter(r => !r.success).length > 20 && '\n…'}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Customers</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Selected: <span className="font-semibold">{selectedIds.size}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm text-gray-700 dark:text-gray-200">
                Search
                <input
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  className="ml-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="name, email, company"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={deliverableOnly}
                  onChange={e => {
                    setDeliverableOnly(e.target.checked);
                    setPage(0);
                  }}
                  className="rounded"
                />
                Deliverable only
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-200">
                Page size
                <select
                  value={size}
                  onChange={e => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="ml-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={allVisibleSelected ? clearAllVisible : selectAllVisible}
                className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
                disabled={contacts.length === 0}
              >
                {allVisibleSelected ? 'Unselect visible' : 'Select visible'}
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
                disabled={selectedIds.size === 0}
              >
                Clear selection
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-2 w-10">Mark</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-2">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loadingContacts ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-600 dark:text-gray-300">
                      Loading…
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-600 dark:text-gray-300">
                      No contacts found.
                    </td>
                  </tr>
                ) : (
                  contacts.map(c => {
                    const checked = selectedIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={classNames(
                          'hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20',
                          checked && 'bg-indigo-50 dark:bg-indigo-900/20'
                        )}
                      >
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(c.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                          {c.name || '—'}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-800 dark:text-gray-200">
                          {c.email}
                        </td>
                        <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                          {c.company || '—'}
                        </td>
                        <td className="py-2 pr-2">
                          <span
                            className={classNames(
                              'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
                              c.email_deliverable
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200'
                            )}
                          >
                            {c.email_deliverable ? 'Yes' : 'Unknown/No'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-700 dark:text-gray-200">
            <div>
              Page <span className="font-semibold">{page + 1}</span> / {totalPages} · Total{' '}
              <span className="font-semibold">{total}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages}
                className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
