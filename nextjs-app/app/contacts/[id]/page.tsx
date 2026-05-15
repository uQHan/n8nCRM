import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ProcessedContactRow } from '@/types';
import ContactDetailClient from './ContactDetailClient';

function Badge({ children, tone }: { children: React.ReactNode; tone: 'green' | 'indigo' | 'amber' }) {
  const cls =
    tone === 'green'
      ? 'bg-green-100 text-green-800'
      : tone === 'indigo'
        ? 'bg-indigo-100 text-indigo-800'
        : 'bg-amber-100 text-amber-800';

  return (
    <span className={`ml-2 text-xs ${cls} px-2 py-0.5 rounded-full`}>
      {children}
    </span>
  );
}

async function getContact(id: string): Promise<ProcessedContactRow> {
  const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load contact (${res.status})`);

  return (await res.json()) as ProcessedContactRow;
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              CRM Data Cleaner
            </Link>
            <nav className="flex space-x-4 text-sm">
              <Link href="/contacts" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-semibold">
                Contacts
              </Link>
              <Link href="/email" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-semibold">
                Send Email
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-10 px-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{contact.id}</p>
          </div>
          <Link
            href="/contacts"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
          >
            Back to Contacts
          </Link>
        </div>

        <ContactDetailClient initialContact={contact} />

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Name</div>
              <div className="text-gray-900 dark:text-white text-base">{contact.name || 'N/A'}</div>
            </div>

            <div>
              <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Email</div>
              <div className="text-gray-900 dark:text-white text-base">
                {contact.email || 'N/A'}
                {contact.email_deliverable && <Badge tone="green">Deliverable</Badge>}
                {contact.enriched && <Badge tone="indigo">Enriched</Badge>}
                {contact.is_duplicate && <Badge tone="amber">Duplicate</Badge>}
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Company</div>
              <div className="text-gray-900 dark:text-white text-base">{contact.company || 'N/A'}</div>
            </div>

            {contact.title && (
              <div>
                <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Job Title</div>
                <div className="text-gray-900 dark:text-white text-base">{contact.title}</div>
              </div>
            )}

            {(contact.phone_formatted || contact.phone) && (
              <div>
                <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Phone</div>
                <div className="text-gray-900 dark:text-white text-base">
                  {contact.phone_formatted || contact.phone}
                </div>
              </div>
            )}

            {(contact.city || contact.state || contact.country) && (
              <div>
                <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Location</div>
                <div className="text-gray-900 dark:text-white text-base">
                  {[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}
                </div>
              </div>
            )}

            {(contact.company_domain || contact.company_industry || contact.company_size || contact.company_location) && (
              <div>
                <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Company Info</div>
                <div className="text-gray-900 dark:text-white text-base space-y-1">
                  {contact.company_domain && <div>Domain: {contact.company_domain}</div>}
                  {contact.company_industry && <div>Industry: {contact.company_industry}</div>}
                  {contact.company_size && <div>Size: {contact.company_size}</div>}
                  {contact.company_location && <div>Location: {contact.company_location}</div>}
                </div>
              </div>
            )}

            {(contact.address || contact.zip) && (
              <div>
                <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Address</div>
                <div className="text-gray-900 dark:text-white text-base">
                  {[contact.address, contact.zip].filter(Boolean).join(' ')}
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Added On</div>
              <div className="text-gray-900 dark:text-white text-base">
                {contact.created_at ? new Date(contact.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Last Updated</div>
              <div className="text-gray-900 dark:text-white text-base">
                {contact.updated_at ? new Date(contact.updated_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
