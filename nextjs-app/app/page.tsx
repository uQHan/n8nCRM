'use client';

import { useCrmProcessing } from '@/lib/useCrmProcessing';
import ChatWidget from './components/ChatWidget';
import UploadSection from './components/UploadSection';
import DataPreview from './components/DataPreview';
import ColumnMappingEditor from './components/ColumnMappingEditor';
import EnrichmentOptionsPanel from './components/EnrichmentOptionsPanel';
import ProcessingProgress from './components/ProcessingProgress';
import ResultsView from './components/ResultsView';

export default function Home() {
  const {
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
  } = useCrmProcessing();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <a href="/">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              CRM Data Cleaner
            </h1>
          </a>
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

        {/* Upload */}
        {viewStage === 'upload' && (
          <UploadSection fileInputRef={fileInputRef} onFileSelect={handleFileSelect} />
        )}

        {/* Preview + Mapping + Enrichment */}
        {viewStage === 'preview' && parsedData && (
          <div className="space-y-6">
            <DataPreview
              fileName={selectedFile?.name || ''}
              parsedData={parsedData}
              onReset={handleReset}
            />
            <ColumnMappingEditor
              parsedData={parsedData}
              columnMappings={columnMappings}
              onMappingChange={(header, value) =>
                setColumnMappings(prev => ({ ...prev, [header]: value }))
              }
            />
            <EnrichmentOptionsPanel
              enrichmentOptions={enrichmentOptions}
              onToggle={toggleEnrichment}
              onStartProcessing={handleStartProcessing}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Processing */}
        {viewStage === 'processing' && processingJob && (
          <ProcessingProgress
            processingJob={processingJob}
            enrichmentOptions={enrichmentOptions}
          />
        )}

        {/* Results */}
        {viewStage === 'results' && processedData && (
          <ResultsView
            processingJob={processingJob}
            processedData={processedData}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </main>

      <ChatWidget />
    </div>
  );
}
