'use client';

import React from 'react';
import type { EnrichmentOptions as EnrichmentOptionsType } from '@/types';

interface EnrichmentOptionsPanelProps {
  enrichmentOptions: EnrichmentOptionsType;
  onToggle: (option: keyof EnrichmentOptionsType) => void;
  onStartProcessing: () => void;
  isProcessing: boolean;
}

export default function EnrichmentOptionsPanel({
  enrichmentOptions,
  onToggle,
  onStartProcessing,
  isProcessing,
}: EnrichmentOptionsPanelProps) {
  const options: { key: keyof EnrichmentOptionsType; title: string; description: string }[] = [
    { key: 'removeDuplicates', title: 'Remove Duplicates', description: 'Identify and merge duplicate contacts' },
    { key: 'verifyEmails', title: 'Verify Emails', description: 'Validate email format and deliverability' },
    { key: 'enrichCompanyData', title: 'Enrich Company Data', description: 'Add company size, industry, and location' },
    { key: 'validatePhoneNumbers', title: 'Validate Phone Numbers', description: 'Format and validate phone numbers' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        Enrichment Options
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select which enrichment steps to apply:
      </p>
      <div className="space-y-3">
        {options.map(({ key, title, description }) => (
          <label key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enrichmentOptions[key]}
              onChange={() => onToggle(key)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div>
              <p className="font-medium text-gray-800 dark:text-white">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onStartProcessing}
          disabled={isProcessing}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Processing
        </button>
      </div>
    </div>
  );
}
