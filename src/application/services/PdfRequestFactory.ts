import path from 'node:path';

import type { IOutputPathResolver } from '../../domain/contracts/IOutputPathResolver';
import { ValidationError } from '../../domain/errors/ValidationError';
import type { Margin } from '../../domain/models/Margin';
import type { PageSize } from '../../domain/models/PageSize';
import type { PdfRequest } from '../../domain/models/PdfRequest';

export interface CliPdfOptions {
  input: string;
  output?: string;
  pageSize?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  smart?: boolean;
  landscape?: boolean;
  preferCssPageSize?: boolean;
  scale?: string | number;
  waitFor?: string | number;
  printBackground?: boolean;
}

export class PdfRequestFactory {
  public constructor(private readonly outputPathResolver: IOutputPathResolver) {}

  public fromCli(options: CliPdfOptions): PdfRequest {
    const inputPath = path.resolve(options.input);
    const outputPath = this.outputPathResolver.resolve(inputPath, options.output);

    const pageSize = this.normalizePageSize(options.pageSize);
    const margins = this.buildMargins(options);

    const scale = this.parseNumber(options.scale, 1, 'scale');
    const waitForMs = this.parseNumber(options.waitFor, 0, 'wait-for');

    if (scale < 0.1 || scale > 2) {
      throw new ValidationError('El parámetro --scale debe estar entre 0.1 y 2.');
    }

    if (waitForMs < 0) {
      throw new ValidationError('El parámetro --wait-for no puede ser negativo.');
    }

    return {
      inputPath,
      outputPath,
      pageSize,
      margins,
      smartMode: options.smart ?? false,
      landscape: options.landscape ?? false,
      preferCssPageSize: options.preferCssPageSize ?? false,
      scale,
      waitForMs,
      printBackground: options.printBackground ?? true
    };
  }

  public normalizePageSize(rawValue?: string): PageSize {
    const value = (rawValue ?? 'A4').trim().toLowerCase();

    switch (value) {
      case 'a0': return 'A0';
      case 'a1': return 'A1';
      case 'a2': return 'A2';
      case 'a3': return 'A3';
      case 'a4': return 'A4';
      case 'a5': return 'A5';
      case 'a6': return 'A6';

      case 'letter':
      case 'carta':
        return 'Letter';
        
      case 'legal':
      case 'oficio':
        return 'Legal';
        
      case 'tabloid':
      case 'tabloide':
        return 'Tabloid';
        
      case 'ledger':
        return 'Ledger';

      case 'singlepage':
      case 'single-page':
      case 'single_page':
      case 'onepage':
      case 'one-page':
      case '1page':
      case '1-pagina':
      case '1pagina':
      case 'una-pagina':
      case 'unapagina':
        return 'SinglePage';

      default:
        throw new ValidationError(
          'El parámetro --page-size debe ser uno de: A0, A1, A2, A3, A4, A5, A6, Letter (Carta), Legal (Oficio), Tabloid, Ledger o SinglePage.'
        );
    }
  }
  

  private buildMargins(options: CliPdfOptions): Margin {
    const fallback = this.normalizeDimension(options.margin ?? '0');

    return {
      top: this.normalizeDimension(options.marginTop ?? fallback),
      right: this.normalizeDimension(options.marginRight ?? fallback),
      bottom: this.normalizeDimension(options.marginBottom ?? fallback),
      left: this.normalizeDimension(options.marginLeft ?? fallback)
    };
  }

  private normalizeDimension(value: string): string {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new ValidationError('Los márgenes no pueden ser vacíos.');
    }

    return normalized;
  }

  private parseNumber(rawValue: string | number | undefined, defaultValue: number, label: string): number {
    if (rawValue === undefined) {
      return defaultValue;
    }

    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);

    if (Number.isNaN(value)) {
      throw new ValidationError(`El parámetro --${label} debe ser numérico.`);
    }

    return value;
  }
}