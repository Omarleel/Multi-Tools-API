import { pathToFileURL } from 'node:url';

import { chromium, type Page } from 'playwright';

import type { IPdfRenderer } from '../../domain/contracts/IPdfRenderer';
import type { Margin } from '../../domain/models/Margin';
import type { PdfRequest } from '../../domain/models/PdfRequest';
import type { PageSize } from '../../domain/models/PageSize';
import type { BrowserSmartLayoutOptimizer } from '../layout/BrowserSmartLayoutOptimizer';
import type { PageMetrics } from '../layout/PageMetrics';

type PdfOptions = NonNullable<Parameters<Page['pdf']>[0]>;

export class PlaywrightPdfRenderer implements IPdfRenderer {
  public constructor(
    private readonly pageMetrics: PageMetrics,
    private readonly smartLayoutOptimizer: BrowserSmartLayoutOptimizer
  ) {}

  public async render(request: PdfRequest): Promise<void> {
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      const targetUrl = pathToFileURL(request.inputPath).toString();

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.emulateMedia({ media: 'print' });

      await this.waitForFonts(page);

      if (request.waitForMs > 0) {
        await page.waitForTimeout(request.waitForMs);
      }

      if (request.smartMode && request.pageSize !== 'SinglePage') {
        const printableHeightPx = this.pageMetrics.getPrintableAreaHeightPx(
          request.pageSize,
          request.landscape,
          request.margins
        );

        await this.smartLayoutOptimizer.optimize(page, printableHeightPx);
      }

      const options =
        request.pageSize === 'SinglePage'
          ? await this.buildSinglePagePdfOptions(page, request)
          : this.buildStandardPdfOptions(request);

      await page.pdf(options);
    } finally {
      await browser.close();
    }
  }

  private buildStandardPdfOptions(request: PdfRequest): PdfOptions {
    return {
      path: request.outputPath,
      format: request.pageSize as Exclude<PageSize, 'SinglePage'>,
      landscape: request.landscape,
      printBackground: request.printBackground,
      preferCSSPageSize: request.preferCssPageSize,
      scale: request.scale,
      margin: request.margins
    };
  }

  private async buildSinglePagePdfOptions(page: Page, request: PdfRequest): Promise<PdfOptions> {
    const measured = await this.measureFullContent(page, request.margins);

    return {
      path: request.outputPath,
      width: `${measured.widthPx}px`,
      height: `${measured.heightPx}px`,
      landscape: false,
      printBackground: request.printBackground,
      preferCSSPageSize: false,
      scale: request.scale,
      margin: request.margins
    };
  }

  private async measureFullContent(
    page: Page,
    margins: Margin
  ): Promise<{ widthPx: number; heightPx: number }> {
    const contentSize = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;

      const width = Math.max(
        doc.scrollWidth,
        doc.offsetWidth,
        doc.clientWidth,
        body?.scrollWidth ?? 0,
        body?.offsetWidth ?? 0,
        body?.clientWidth ?? 0
      );

      const height = Math.max(
        doc.scrollHeight,
        doc.offsetHeight,
        doc.clientHeight,
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
        body?.clientHeight ?? 0
      );

      return { width, height };
    });

    const totalHorizontalMargin =
      this.pageMetrics.parseDimensionToPx(margins.left) +
      this.pageMetrics.parseDimensionToPx(margins.right);

    const totalVerticalMargin =
      this.pageMetrics.parseDimensionToPx(margins.top) +
      this.pageMetrics.parseDimensionToPx(margins.bottom);

    return {
      widthPx: Math.ceil(contentSize.width + totalHorizontalMargin),
      heightPx: Math.ceil(contentSize.height + totalVerticalMargin)
    };
  }

  private async waitForFonts(page: Page): Promise<void> {
    await page.evaluate(async () => {
      const withFonts = document as Document & {
        fonts?: {
          ready?: Promise<unknown>;
        };
      };

      if (withFonts.fonts?.ready) {
        await withFonts.fonts.ready;
      }
    });
  }
}