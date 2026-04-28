'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { parseFile, autoDetectMappings, downloadCSV } from '@/lib/fileParser';
import type {
  EnrichmentOptions,
  ProcessingJob,
  ParsedFileData,
  ProcessedContactRow,
} from '@/types';

export type ViewStage = 'upload' | 'preview' | 'processing' | 'results';

export interface CrmProcessingState {
  viewStage: ViewStage;
  selectedFile: File | null;
  parsedData: ParsedFileData | null;
  columnMappings: Record<string, string>;
  enrichmentOptions: EnrichmentOptions;
  processingJob: ProcessingJob | null;
  processedData: ProcessedContactRow[];
  error: string | null;
  isProcessing: boolean;
}

export interface CrmProcessingActions {
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  toggleEnrichment: (option: keyof EnrichmentOptions) => void;
  setColumnMappings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleStartProcessing: () => Promise<void>;
  handleDownload: () => void;
  handleReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Issue #8: Extracted all API/polling/state logic into a reusable hook,
 * keeping page.tsx focused on presentation.
 *
 * Issue #22: Polling uses exponential backoff (1s → 2s → 4s, capped at 5s)
 * instead of a fixed 1000ms interval.
 */
export function useCrmProcessing(): CrmProcessingState & CrmProcessingActions {
  const [viewStage, setViewStage] = useState<ViewStage>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [enrichmentOptions, setEnrichmentOptions] = useState<EnrichmentOptions>({
    verifyEmails: true,
    enrichCompanyData: false,
    validatePhoneNumbers: false,
    removeDuplicates: true,
  });
  const [processingJob, setProcessingJob] = useState<ProcessingJob | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContactRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);

    try {
      const parsed = await parseFile(file);
      setParsedData(parsed);
      const mappings = autoDetectMappings(parsed.headers);
      setColumnMappings(mappings);
      setViewStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setSelectedFile(null);
    }
  }, []);

  const toggleEnrichment = useCallback((option: keyof EnrichmentOptions) => {
    setEnrichmentOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  }, []);

  const fetchProcessedData = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/crm/jobs/${jobId}/processed-contacts`);
      if (!res.ok) throw new Error('Failed to fetch processed data');
      const data = await res.json();
      setProcessedData(data || []);
      setViewStage('results');
      setIsProcessing(false);
    } catch {
      setError('Failed to fetch processed data');
      setIsProcessing(false);
    }
  }, [backendBaseUrl]);

  const handleStartProcessing = useCallback(async () => {
    if (!parsedData || !selectedFile) return;

    setError(null);
    setIsProcessing(true);
    setViewStage('processing');

    try {
      const response = await fetch(`${backendBaseUrl}/api/crm/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData.rows,
          columnMappings,
          enrichmentOptions,
          totalRows: parsedData.totalRows,
        }),
      });

      if (!response.ok) throw new Error('Failed to start processing');

      const job = (await response.json()) as ProcessingJob;
      setProcessingJob(job);

      // Issue #22: Exponential backoff polling (1s → 2s → 4s, capped at 5s)
      let delay = 1000;
      const poll = async () => {
        try {
          const jobRes = await fetch(`${backendBaseUrl}/api/crm/jobs/${job.id}`);
          if (!jobRes.ok) return;
          const latest = (await jobRes.json()) as ProcessingJob;
          setProcessingJob(latest);

          if (latest.status === 'completed') {
            fetchProcessedData(job.id);
            return;
          } else if (latest.status === 'failed') {
            setError('Processing failed. Please try again.');
            setIsProcessing(false);
            return;
          }
        } catch {
          // ignore transient polling errors
        }
        delay = Math.min(delay * 2, 5000);
        pollRef.current = setTimeout(poll, delay);
      };

      pollRef.current = setTimeout(poll, delay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start processing');
      setIsProcessing(false);
      setViewStage('preview');
    }
  }, [parsedData, selectedFile, backendBaseUrl, columnMappings, enrichmentOptions, fetchProcessedData]);

  const handleDownload = useCallback(() => {
    if (processedData.length === 0) return;
    const filename = `cleaned_${selectedFile?.name || 'data.csv'}`;
    downloadCSV(processedData, filename);
  }, [processedData, selectedFile]);

  const handleReset = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
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
  }, []);

  return {
    viewStage,
    selectedFile,
    parsedData,
    columnMappings,
    enrichmentOptions,
    processingJob,
    processedData,
    error,
    isProcessing,
    handleFileSelect,
    toggleEnrichment,
    setColumnMappings,
    handleStartProcessing,
    handleDownload,
    handleReset,
    fileInputRef,
  };
}
