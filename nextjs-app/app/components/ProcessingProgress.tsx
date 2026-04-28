'use client';

import React from 'react';
import type { ProcessingJob, EnrichmentOptions } from '@/types';

interface ProcessingProgressProps {
  processingJob: ProcessingJob;
  enrichmentOptions: EnrichmentOptions;
}

const STAGES = [
  'uploaded', 'validating', 'cleaning', 'deduplicating',
  'enriching_emails', 'enriching_companies', 'validating_phones', 'completed',
] as const;

function ProcessingStageItem({
  label,
  stage,
  currentStage,
}: {
  label: string;
  stage: string;
  currentStage: string;
}) {
  const currentIndex = STAGES.indexOf(currentStage as typeof STAGES[number]);
  const stageIndex = STAGES.indexOf(stage as typeof STAGES[number]);

  const isCompleted = stageIndex < currentIndex || currentStage === 'completed';
  const isActive = stageIndex === currentIndex;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-green-500' : isActive ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        {isCompleted && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isActive && (
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        )}
      </div>
      <span className={`text-sm ${
        isCompleted || isActive ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {label}
      </span>
      {isActive && (
        <span className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
          Processing...
        </span>
      )}
    </div>
  );
}

export default function ProcessingProgress({ processingJob, enrichmentOptions }: ProcessingProgressProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        Processing Your Data
      </h3>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{processingJob.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${processingJob.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Processing Stages */}
        <div className="space-y-3">
          <ProcessingStageItem label="Upload Complete" stage="uploaded" currentStage={processingJob.current_stage} />
          <ProcessingStageItem label="Validating Data" stage="validating" currentStage={processingJob.current_stage} />
          <ProcessingStageItem label="Cleaning Data" stage="cleaning" currentStage={processingJob.current_stage} />
          {enrichmentOptions.removeDuplicates && (
            <ProcessingStageItem label="Removing Duplicates" stage="deduplicating" currentStage={processingJob.current_stage} />
          )}
          {enrichmentOptions.verifyEmails && (
            <ProcessingStageItem label="Verifying Emails" stage="enriching_emails" currentStage={processingJob.current_stage} />
          )}
          {enrichmentOptions.enrichCompanyData && (
            <ProcessingStageItem label="Enriching Company Data" stage="enriching_companies" currentStage={processingJob.current_stage} />
          )}
          {enrichmentOptions.validatePhoneNumbers && (
            <ProcessingStageItem label="Validating Phone Numbers" stage="validating_phones" currentStage={processingJob.current_stage} />
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Processed {processingJob.processed_rows} of {processingJob.total_rows} rows
        </div>
      </div>
    </div>
  );
}
