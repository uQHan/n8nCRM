import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

/**
 * Parse CSV file to structured data
 */
export const parseCSV = (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, any>[];
        
        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

/**
 * Convert Excel file to CSV then parse
 */
export const parseExcel = async (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        // Extract headers from first row
        const headers = Object.keys(jsonData[0] as Record<string, any>);
        
        resolve({
          headers,
          rows: jsonData as Record<string, any>[],
          totalRows: jsonData.length,
        });
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Auto-detect file type and parse accordingly
 */
export const parseFile = async (file: File): Promise<ParsedData> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload CSV or Excel file.');
  }
};

/**
 * Auto-detect CRM field mappings from CSV headers
 */
export const autoDetectMappings = (headers: string[]): Record<string, string> => {
  const mappings: Record<string, string> = {};
  
  const commonMappings: Record<string, string[]> = {
    name: ['name', 'full name', 'fullname', 'contact name', 'customer name'],
    email: ['email', 'email address', 'e-mail', 'emailaddress'],
    phone: ['phone', 'phone number', 'phonenumber', 'telephone', 'tel', 'mobile'],
    company: ['company', 'company name', 'organization', 'organisation', 'business'],
    title: ['title', 'job title', 'position', 'role'],
    address: ['address', 'street address', 'location'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
    country: ['country'],
    zip: ['zip', 'zipcode', 'postal code', 'postcode'],
    website: ['website', 'url', 'web', 'site'],
  };
  
  headers.forEach((header) => {
    const normalizedHeader = header.toLowerCase().trim();
    
    for (const [crmField, variations] of Object.entries(commonMappings)) {
      if (variations.includes(normalizedHeader)) {
        mappings[header] = crmField;
        break;
      }
    }
    
    // If no match, keep original
    if (!mappings[header]) {
      mappings[header] = header;
    }
  });
  
  return mappings;
};

/**
 * Convert parsed data to CSV string for download
 */
export const convertToCSV = (data: Record<string, any>[]): string => {
  if (data.length === 0) return '';
  
  const csv = Papa.unparse(data);
  return csv;
};

/**
 * Trigger download of CSV file
 */
export const downloadCSV = (data: Record<string, any>[], filename: string) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
