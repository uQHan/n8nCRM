'use client';

import React from 'react';
import type { ProcessingJob, ProcessedContactRow } from '@/types';

interface ResultsViewProps {
  processingJob: ProcessingJob | null;
  processedData: ProcessedContactRow[];
  onDownload: () => void;
  onReset: () => void;
}

export default function ResultsView({
  processingJob,
  processedData,
  onDownload,
  onReset,
}: ResultsViewProps) {
  const headers = processedData.length > 0 ? Object.keys(processedData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          ✓ Processing Complete!
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {processingJob?.total_rows || 0}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cleaned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {processedData.length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Enriched</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {processedData.filter((r) => r.enriched).length || processedData.length}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {processingJob?.error_count || 0}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onDownload}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition"
          >
            Download Cleaned CSV
          </button>
          <button
            onClick={onReset}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition"
          >
            Process Another File
          </button>
        </div>
      </div>

      {/* Results Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Results Preview (first 50 rows)
        </h4>
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {headers.map((key, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processedData.slice(0, 50).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {headers.map((key, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      {row[key]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
