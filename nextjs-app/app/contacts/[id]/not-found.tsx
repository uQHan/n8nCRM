import Link from 'next/link';

export default function ContactNotFound() {
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

      <main className="container mx-auto py-16 px-6 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            The contact you’re looking for doesn’t exist or was removed.
          </p>
          <div className="mt-6">
            <Link
              href="/contacts"
              className="inline-flex px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm font-medium"
            >
              Back to Contacts
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
