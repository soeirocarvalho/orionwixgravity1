import { Readable } from "stream";
import csv from "csv-parser";
import * as XLSX from "xlsx";
import { z } from "zod";
import type { InsertDrivingForce } from "@shared/schema";

// Schema for validating imported driving forces
const importedDrivingForceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["M", "T", "WS", "WC"], { errorMap: () => ({ message: "Type must be one of: M, T, WS, WC" }) }),
  steep: z.enum(["Social", "Technological", "Economic", "Environmental", "Political"], { 
    errorMap: () => ({ message: "STEEP must be one of: Social, Technological, Economic, Environmental, Political" }) 
  }),
  scope: z.string().optional(),
  impact: z.number().min(1).max(10).optional(),
  ttm: z.string().optional(),
  sentiment: z.enum(["Positive", "Negative", "Neutral"]).optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  text: z.string().min(1, "Text description is required"),
});

export interface ParsedDrivingForce {
  title: string;
  type: string;
  steep: string;
  scope?: string;
  impact?: number;
  ttm?: string;
  sentiment?: string;
  source?: string;
  tags?: string[];
  text: string;
}

export class FileParserService {
  async parseFile(buffer: Buffer, filename: string, mimeType: string): Promise<ParsedDrivingForce[]> {
    const ext = filename.toLowerCase().split('.').pop();
    
    switch (ext) {
      case 'csv':
        return this.parseCSV(buffer);
      case 'xlsx':
      case 'xls':
        return this.parseXLSX(buffer);
      case 'json':
        return this.parseJSON(buffer);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  private async parseCSV(buffer: Buffer): Promise<ParsedDrivingForce[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            const parsed = this.validateAndMapData(results);
            resolve(parsed);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private parseXLSX(buffer: Buffer): ParsedDrivingForce[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('No sheets found in Excel file');
      }
      
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      return this.validateAndMapData(jsonData);
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseJSON(buffer: Buffer): ParsedDrivingForce[] {
    try {
      const jsonStr = buffer.toString();
      const data = JSON.parse(jsonStr);
      
      // Handle both array of objects and single object
      const arrayData = Array.isArray(data) ? data : [data];
      
      return this.validateAndMapData(arrayData);
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  }

  private validateAndMapData(rawData: any[]): ParsedDrivingForce[] {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('No valid data found in file');
    }

    const results: ParsedDrivingForce[] = [];
    const errors: string[] = [];

    rawData.forEach((row, index) => {
      try {
        // Map common field variations to our schema
        const mappedRow = this.mapFieldNames(row);
        
        // Validate the data
        const validated = importedDrivingForceSchema.parse(mappedRow);
        
        results.push(validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          errors.push(`Row ${index + 1}: ${fieldErrors}`);
        } else {
          errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`All rows failed validation:\n${errors.join('\n')}`);
    }

    if (errors.length > 0) {
      console.warn(`Some rows failed validation:\n${errors.join('\n')}`);
    }

    return results;
  }

  private mapFieldNames(row: any): any {
    // Create a case-insensitive field mapper
    const fieldMappings: { [key: string]: string } = {
      // Title variations
      'title': 'title',
      'name': 'title',
      'force': 'title',
      'driving_force': 'title',
      'drivingforce': 'title',
      
      // Type variations
      'type': 'type',
      'category': 'type',
      'lens': 'type',
      
      // STEEP variations
      'steep': 'steep',
      'dimension': 'steep',
      'domain': 'steep',
      'category_steep': 'steep',
      
      // Impact variations
      'impact': 'impact',
      'score': 'impact',
      'rating': 'impact',
      'importance': 'impact',
      
      // Time to market variations
      'ttm': 'ttm',
      'time_to_market': 'ttm',
      'timeframe': 'ttm',
      'horizon': 'ttm',
      'timeline': 'ttm',
      
      // Sentiment variations
      'sentiment': 'sentiment',
      'polarity': 'sentiment',
      'attitude': 'sentiment',
      
      // Text variations
      'text': 'text',
      'description': 'text',
      'content': 'text',
      'summary': 'text',
      'details': 'text',
      
      // Source variations
      'source': 'source',
      'url': 'source',
      'reference': 'source',
      'origin': 'source',
      
      // Scope variations
      'scope': 'scope',
      'scale': 'scope',
      'level': 'scope',
      
      // Tags variations
      'tags': 'tags',
      'keywords': 'tags',
      'labels': 'tags',
    };

    const mapped: any = {};
    
    // Convert all keys to lowercase and map them
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().replace(/[_\s-]/g, '');
      const mappedKey = fieldMappings[lowerKey] || fieldMappings[key.toLowerCase()];
      
      if (mappedKey) {
        let value = row[key];
        
        // Trim string values to handle whitespace-only cells
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        // Convert empty strings, null, and undefined to undefined for optional fields
        // This handles Excel/CSV empty cells that become '' instead of null/undefined
        if (value === '' || value === null || value === undefined) {
          value = undefined;
        }
        
        // Handle special transformations
        if (mappedKey === 'impact' && typeof value === 'string') {
          const parsed = parseFloat(value);
          value = isNaN(parsed) ? undefined : parsed;
        }
        
        if (mappedKey === 'tags' && typeof value === 'string') {
          value = value.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
        
        // Only set the value if it's not undefined (skip empty optional fields)
        if (value !== undefined) {
          mapped[mappedKey] = value;
        }
      }
    });

    return mapped;
  }

  generateTemplate(format: 'csv' | 'xlsx' | 'json'): Buffer {
    // Sample data with clear examples for each type and STEEP category
    const sampleData = [
      {
        title: "Global Climate Action Framework",
        type: "M",
        steep: "Environmental",
        scope: "Global",
        impact: 9.5,
        ttm: "5-10 years",
        sentiment: "Positive",
        source: "IPCC Report 2024",
        tags: "climate,sustainability,policy",
        text: "International cooperation on climate change mitigation and adaptation strategies reshaping global economic and political landscapes."
      },
      {
        title: "AI-Powered Personalized Medicine",
        type: "T",
        steep: "Technological",
        scope: "Regional",
        impact: 8.7,
        ttm: "2-5 years",
        sentiment: "Positive",
        source: "Nature Medicine Journal",
        tags: "AI,healthcare,precision-medicine",
        text: "Machine learning algorithms analyzing genetic data to create customized treatment plans for individual patients."
      },
      {
        title: "Quantum Computing Breakthrough in Cryptography",
        type: "WS",
        steep: "Technological",
        scope: "Global",
        impact: 7.2,
        ttm: "5-10 years",
        sentiment: "Neutral",
        source: "MIT Technology Review",
        tags: "quantum,security,encryption",
        text: "Early-stage quantum computers demonstrating potential to break current encryption standards, requiring new security protocols."
      },
      {
        title: "Major Cyber Attack on Critical Infrastructure",
        type: "WC",
        steep: "Political",
        scope: "Regional",
        impact: 9.8,
        ttm: "0-2 years",
        sentiment: "Negative",
        source: "Cybersecurity Threat Report",
        tags: "cybersecurity,infrastructure,risk",
        text: "Potential large-scale coordinated cyber attack targeting power grids and financial systems in major economies."
      },
      {
        title: "Universal Basic Income Pilot Programs",
        type: "T",
        steep: "Social",
        scope: "Local",
        impact: 6.5,
        ttm: "2-5 years",
        sentiment: "Neutral",
        source: "Economic Policy Institute",
        tags: "UBI,welfare,economics",
        text: "Cities testing universal basic income to address income inequality and automation-driven job displacement."
      },
      {
        title: "Circular Economy Transition",
        type: "M",
        steep: "Economic",
        scope: "Global",
        impact: 8.9,
        ttm: "5-10 years",
        sentiment: "Positive",
        source: "World Economic Forum",
        tags: "circular-economy,sustainability,business",
        text: "Shift from linear 'take-make-dispose' model to circular systems that eliminate waste and regenerate natural resources."
      }
    ];

    switch (format) {
      case 'csv':
        const headers = Object.keys(sampleData[0]).join(',');
        const rows = sampleData.map(row => 
          Object.values(row).map(val => `"${val}"`).join(',')
        ).join('\n');
        return Buffer.from(`${headers}\n${rows}`);
        
      case 'xlsx':
        // Create data sheet with samples
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Driving Forces');
        
        // Create instructions sheet
        const instructions = [
          { Field: 'title', Required: 'Yes', Format: 'Text', Example: 'AI-Powered Personalized Medicine', Notes: 'Short descriptive title for the driving force' },
          { Field: 'type', Required: 'Yes', Format: 'Code', Example: 'M, T, WS, or WC', Notes: 'M=Megatrend, T=Trend, WS=Weak Signal, WC=Wildcard' },
          { Field: 'steep', Required: 'Yes', Format: 'Text', Example: 'Technological', Notes: 'Must be: Social, Technological, Economic, Environmental, or Political' },
          { Field: 'text', Required: 'Yes', Format: 'Text', Example: 'Detailed description...', Notes: 'Full description of the driving force' },
          { Field: 'scope', Required: 'No', Format: 'Text', Example: 'Global, Regional, or Local', Notes: 'Geographic scope of impact' },
          { Field: 'impact', Required: 'No', Format: 'Number', Example: '8.5', Notes: 'Impact score from 1 to 10 (decimals allowed)' },
          { Field: 'ttm', Required: 'No', Format: 'Text', Example: '2-5 years', Notes: 'Time to market as text (e.g., "0-2 years", "5-10 years")' },
          { Field: 'sentiment', Required: 'No', Format: 'Text', Example: 'Positive, Negative, or Neutral', Notes: 'Overall sentiment of the driving force' },
          { Field: 'source', Required: 'No', Format: 'Text', Example: 'McKinsey Report 2024', Notes: 'Source of information' },
          { Field: 'tags', Required: 'No', Format: 'Text', Example: 'AI,healthcare,innovation', Notes: 'Comma-separated tags (no spaces after commas)' }
        ];
        
        const wsInstructions = XLSX.utils.json_to_sheet(instructions);
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
        
        return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
        
      case 'json':
        return Buffer.from(JSON.stringify(sampleData, null, 2));
        
      default:
        throw new Error(`Unsupported template format: ${format}`);
    }
  }
}

export const fileParserService = new FileParserService();