'use client';

import { useState, useEffect, useRef } from 'react';
import { parseFile, autoDetectMappings, downloadCSV } from '@/lib/fileParser';
import { EnrichmentOptions, ProcessingJob, ProcessingStage } from '@/types';
import { createClient } from '@/utils/supabase/client';

type ViewStage = 'upload' | 'preview' | 'processing' | 'results';

export default function Home() {
  const [viewStage, setViewStage] = useState<ViewStage>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [enrichmentOptions, setEnrichmentOptions] = useState<EnrichmentOptions>({
    verifyEmails: true,
    enrichCompanyData: false,
    validatePhoneNumbers: false,
    removeDuplicates: true,
  });
  const [processingJob, setProcessingJob] = useState<ProcessingJob | null>(null);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);

    try {
      const parsed = await parseFile(file);
      setParsedData(parsed);
      
      // Auto-detect column mappings
      const mappings = autoDetectMappings(parsed.headers);
      setColumnMappings(mappings);
      
      setViewStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setSelectedFile(null);
    }
  };

  // Handle enrichment option toggle
  const toggleEnrichment = (option: keyof EnrichmentOptions) => {
    setEnrichmentOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Start processing
  const handleStartProcessing = async () => {
    if (!parsedData || !selectedFile) return;

    setError(null);
    setIsProcessing(true);
    setViewStage('processing');

    try {
      // Create processing job in Supabase
      const { data: job, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          status: 'uploading',
          progress: 0,
          current_stage: 'uploaded',
          total_rows: parsedData.totalRows,
          processed_rows: 0,
          error_count: 0,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      setProcessingJob(job);

      // Subscribe to job updates via Supabase Realtime
      const channel = supabase
        .channel(`processing_job_${job.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'processing_jobs',
            filter: `id=eq.${job.id}`,
          },
          (payload) => {
            console.log('Job update:', payload);
            setProcessingJob(payload.new as ProcessingJob);

            if (payload.new.status === 'completed') {
              // Fetch processed data
              fetchProcessedData(job.id);
            } else if (payload.new.status === 'failed') {
              setError('Processing failed. Please try again.');
              setIsProcessing(false);
            }
          }
        )
        .subscribe();

      // Send data to n8n webhook
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/process-crm';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          data: parsedData.rows,
          columnMappings,
          enrichmentOptions,
          totalRows: parsedData.totalRows,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start processing');
      setIsProcessing(false);
      setViewStage('preview');
    }
  };

  // Fetch processed data
  const fetchProcessedData = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('processed_contacts')
        .select('*')
        .eq('job_id', jobId);

      if (error) throw error;

      setProcessedData(data || []);
      setViewStage('results');
      setIsProcessing(false);
    } catch (err) {
      setError('Failed to fetch processed data');
      setIsProcessing(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (processedData.length === 0) return;
    
    const filename = `cleaned_${selectedFile?.name || 'data.csv'}`;
    downloadCSV(processedData, filename);
  };

  // Reset to start over
  const handleReset = () => {
    setViewStage('upload');
    setSelectedFile(null);
    setParsedData(null);
    setColumnMappings({});
    setProcessingJob(null);
    setProcessedData([]);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with auth placeholder */}
      <header className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            CRM Data Cleaner
          </h1>
          {/* Future: Auth components will go here */}
          <div className="auth-placeholder"></div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-6 max-w-6xl">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Upload Section */}
        {viewStage === 'upload' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                CRM Data Cleaning & Enrichment
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Upload your CRM data in CSV or Excel format. Our automated workflow will clean, 
                validate, and enrich your contact data with intelligent processing.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <label 
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-12 h-12 mb-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV or Excel (XLSX) files</p>
                </div>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        )}

        {/* Preview, Mapping, and Enrichment Options */}
        {viewStage === 'preview' && parsedData && (
          <div className="space-y-6">
            {/* File Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedFile?.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {parsedData.totalRows.toLocaleString()} rows • {parsedData.headers.length} columns
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Change File
                </button>
              </div>

              {/* Data Preview */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Preview (first 50 rows)
                </p>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden overflow-x-auto [&::-webkit-scrollbar]:w-5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {parsedData.headers.map((header: string, idx: number) => (
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
                      {parsedData.rows.slice(0, 50).map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {parsedData.headers.map((header: string, colIdx: number) => (
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

            {/* Column Mapping Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Column Mapping
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We've auto-detected your column mappings. Adjust if needed:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedData.headers.map((header: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-1/2">
                      {header}
                    </span>
                    <span className="text-gray-400">→</span>
                    <select
                      value={columnMappings[header] || header}
                      onChange={(e) => setColumnMappings(prev => ({ ...prev, [header]: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <option value={header}>{header}</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="company">Company</option>
                      <option value="title">Job Title</option>
                      <option value="address">Address</option>
                      <option value="city">City</option>
                      <option value="state">State</option>
                      <option value="country">Country</option>
                      <option value="website">Website</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Enrichment Options Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Enrichment Options
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which enrichment steps to apply:
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichmentOptions.removeDuplicates}
                    onChange={() => toggleEnrichment('removeDuplicates')}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Remove Duplicates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Identify and merge duplicate contacts</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichmentOptions.verifyEmails}
                    onChange={() => toggleEnrichment('verifyEmails')}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Verify Emails</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Validate email format and deliverability</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichmentOptions.enrichCompanyData}
                    onChange={() => toggleEnrichment('enrichCompanyData')}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Enrich Company Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add company size, industry, and location</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichmentOptions.validatePhoneNumbers}
                    onChange={() => toggleEnrichment('validatePhoneNumbers')}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Validate Phone Numbers</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Format and validate phone numbers</p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleStartProcessing}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Processing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {viewStage === 'processing' && processingJob && (
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
                <ProcessingStageItem 
                  label="Upload Complete"
                  stage="uploaded"
                  currentStage={processingJob.current_stage}
                />
                <ProcessingStageItem 
                  label="Validating Data"
                  stage="validating"
                  currentStage={processingJob.current_stage}
                />
                <ProcessingStageItem 
                  label="Cleaning Data"
                  stage="cleaning"
                  currentStage={processingJob.current_stage}
                />
                {enrichmentOptions.removeDuplicates && (
                  <ProcessingStageItem 
                    label="Removing Duplicates"
                    stage="deduplicating"
                    currentStage={processingJob.current_stage}
                  />
                )}
                {enrichmentOptions.verifyEmails && (
                  <ProcessingStageItem 
                    label="Verifying Emails"
                    stage="enriching_emails"
                    currentStage={processingJob.current_stage}
                  />
                )}
                {enrichmentOptions.enrichCompanyData && (
                  <ProcessingStageItem 
                    label="Enriching Company Data"
                    stage="enriching_companies"
                    currentStage={processingJob.current_stage}
                  />
                )}
                {enrichmentOptions.validatePhoneNumbers && (
                  <ProcessingStageItem 
                    label="Validating Phone Numbers"
                    stage="validating_phones"
                    currentStage={processingJob.current_stage}
                  />
                )}
              </div>

              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Processed {processingJob.processed_rows} of {processingJob.total_rows} rows
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {viewStage === 'results' && processedData && (
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
                    {processedData.filter((r: any) => r.enriched).length || processedData.length}
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
                  onClick={handleDownload}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition"
                >
                  Download Cleaned CSV
                </button>
                <button
                  onClick={handleReset}
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
                      {processedData.length > 0 && Object.keys(processedData[0]).map((key, idx) => (
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
                    {processedData.slice(0, 50).map((row: any, rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {Object.values(row).map((value: any, colIdx: number) => (
                          <td
                            key={colIdx}
                            className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                          >
                            {value?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper component for processing stage items
function ProcessingStageItem({ 
  label, 
  stage, 
  currentStage 
}: { 
  label: string; 
  stage: string; 
  currentStage: string;
}) {
  const stages = ['uploaded', 'validating', 'cleaning', 'deduplicating', 'enriching_emails', 'enriching_companies', 'validating_phones', 'completed'];
  const currentIndex = stages.indexOf(currentStage);
  const stageIndex = stages.indexOf(stage);
  
  const isCompleted = stageIndex < currentIndex || currentStage === 'completed';
  const isActive = stageIndex === currentIndex;
  const isPending = stageIndex > currentIndex;

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
