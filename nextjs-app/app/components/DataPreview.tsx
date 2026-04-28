'use client';

import React from 'react';
import type { ParsedFileData } from '@/types';

interface DataPreviewProps {
  fileName: string;
  parsedData: ParsedFileData;
  onReset: () => void;
}

export default function DataPreview({ fileName, parsedData, onReset }: DataPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {fileName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {parsedData.totalRows.toLocaleString()} rows • {parsedData.headers.length} columns
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          Change File
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Preview (first 50 rows)
        </p>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden overflow-x-auto [&::-webkit-scrollbar]:w-5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {parsedData.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {parsedData.rows.slice(0, 50).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {parsedData.headers.map((header, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      {row[header] || '-'}
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
