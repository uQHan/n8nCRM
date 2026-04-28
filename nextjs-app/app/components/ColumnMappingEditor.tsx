'use client';

import React from 'react';
import type { ParsedFileData } from '@/types';

interface ColumnMappingEditorProps {
  parsedData: ParsedFileData;
  columnMappings: Record<string, string>;
  onMappingChange: (header: string, value: string) => void;
}

export default function ColumnMappingEditor({
  parsedData,
  columnMappings,
  onMappingChange,
}: ColumnMappingEditorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        Column Mapping
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        We&apos;ve auto-detected your column mappings. Adjust if needed:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parsedData.headers.map((header, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-1/2">
              {header}
            </span>
            <span className="text-gray-400">→</span>
            <select
              value={columnMappings[header] || header}
              onChange={(e) => onMappingChange(header, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value={header}>{header}</option>
              <option value="name">name</option>
              <option value="email">email</option>
              <option value="phone">phone</option>
              <option value="company">company</option>
              <option value="title">title</option>
              <option value="address">address</option>
              <option value="city">city</option>
              <option value="state">state</option>
              <option value="country">country</option>
              <option value="website">website</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
