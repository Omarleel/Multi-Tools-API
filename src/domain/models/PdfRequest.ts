import type { Margin } from './Margin';
import { PageSize } from './PageSize';

export interface PdfRequest {
  inputPath: string;
  outputPath: string;
  pageSize: PageSize;
  margins: Margin;
  smartMode: boolean;
  landscape: boolean;
  preferCssPageSize: boolean;
  scale: number;
  waitForMs: number;
  printBackground: boolean;
}