import type { Margin } from '../../domain/models/Margin';
import type { PageSize, StandardPageSize } from '../../domain/models/PageSize';

type PhysicalPageSize = {
  widthMm: number;
  heightMm: number;
};

export class PageMetrics {
  private static readonly CSS_DPI = 96;
  private static readonly MM_PER_INCH = 25.4;

  private readonly sizes: Record<StandardPageSize, PhysicalPageSize> = {
    Letter: { widthMm: 215.9, heightMm: 279.4 },
    Legal: { widthMm: 215.9, heightMm: 355.6 },
    Tabloid: { widthMm: 279.4, heightMm: 431.8 },
    Ledger: { widthMm: 431.8, heightMm: 279.4 },
    A0: { widthMm: 841, heightMm: 1189 },
    A1: { widthMm: 594, heightMm: 841 },
    A2: { widthMm: 420, heightMm: 594 },
    A3: { widthMm: 297, heightMm: 420 },
    A4: { widthMm: 210, heightMm: 297 },
    A5: { widthMm: 148, heightMm: 210 },
    A6: { widthMm: 105, heightMm: 148 }
  };

  public getPrintableAreaHeightPx(
    pageSize: Exclude<PageSize, 'SinglePage'>,
    landscape: boolean,
    margins: Margin
  ): number {
    const page = this.sizes[pageSize];
    const pageHeightMm = landscape ? page.widthMm : page.heightMm;
    const pageHeightPx = this.mmToPx(pageHeightMm);

    const top = this.parseDimensionToPx(margins.top);
    const bottom = this.parseDimensionToPx(margins.bottom);

    return Math.max(0, pageHeightPx - top - bottom);
  }

  public parseDimensionToPx(rawValue: string): number {
    const value = rawValue.trim().toLowerCase();
    const match = /^([0-9]*\.?[0-9]+)\s*(px|mm|cm|in)?$/i.exec(value);

    if (!match) {
      throw new Error(`Dimensión inválida: "${rawValue}". Usa px, mm, cm o in.`);
    }

    const amount = Number(match[1]);
    const unit = (match[2] ?? 'px').toLowerCase();

    switch (unit) {
      case 'px':
        return amount;
      case 'mm':
        return this.mmToPx(amount);
      case 'cm':
        return this.mmToPx(amount * 10);
      case 'in':
        return amount * PageMetrics.CSS_DPI;
      default:
        throw new Error(`Unidad no soportada: ${unit}`);
    }
  }

  private mmToPx(valueMm: number): number {
    return (valueMm / PageMetrics.MM_PER_INCH) * PageMetrics.CSS_DPI;
  }
}