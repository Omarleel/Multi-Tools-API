import type { Page } from 'playwright';

export class BrowserSmartLayoutOptimizer {
  private static readonly CONTINUATION_TOP_OFFSET = '10mm';

  public async optimize(page: Page, printableHeightPx: number): Promise<void> {
    await page.addStyleTag({
      content: `
        @media print {
          body {
            display: block !important;
            justify-content: initial !important;
          }

          .container {
            overflow: visible !important;
          }

          .pdf-smart-spacer {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            width: 100% !important;
            background: transparent !important;
          }

          /* Bloques raíz */
          [data-pdf-keep] {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }

          /* Bloques decorados que pueden fragmentarse */
          .container,
          [data-pdf-keep] {
            -webkit-box-decoration-break: clone !important;
            box-decoration-break: clone !important;
          }

          /* Segmentos internos */
          [data-pdf-segment] {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
          }

          /*
            Cuando un bloque es fragmentable, NO le quitamos padding ni fondo.
            Solo neutralizamos sombras/overflow problemáticos.
          */
          .pdf-fragment-host {
            box-shadow: none !important;
            overflow: visible !important;
            -webkit-box-decoration-break: clone !important;
            box-decoration-break: clone !important;
          }
        }
      `
    });

    await page.evaluate(
      (payload: { contentHeightPx: number; continuationTopOffsetCss: string }) => {
        const EPSILON = 2;
        const contentHeightPx = payload.contentHeightPx;
        const continuationTopOffsetCss = payload.continuationTopOffsetCss;

        const rootSelector = '[data-pdf-keep]';

        const measureNode = document.createElement('div');
        measureNode.style.position = 'absolute';
        measureNode.style.left = '-99999px';
        measureNode.style.top = '0';
        measureNode.style.height = continuationTopOffsetCss;
        measureNode.style.width = '1px';
        measureNode.style.padding = '0';
        measureNode.style.margin = '0';
        measureNode.style.border = '0';
        document.body.appendChild(measureNode);
        const continuationTopOffsetPx = measureNode.getBoundingClientRect().height;
        measureNode.remove();

        const oldSpacers = document.querySelectorAll('.pdf-smart-spacer');
        for (const spacer of Array.from(oldSpacers)) {
          spacer.remove();
        }

        const roots: HTMLElement[] = [];
        const rootNodes = document.querySelectorAll<HTMLElement>(rootSelector);

        for (const node of Array.from(rootNodes)) {
          const rect = node.getBoundingClientRect();
          const style = window.getComputedStyle(node);

          const isVisible =
            rect.height > 0 &&
            rect.width > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden';

          if (isVisible) {
            roots.push(node);
          }
        }

        for (const root of roots) {
          root.style.breakInside = 'avoid-page';
          root.style.pageBreakInside = 'avoid';

          const rootRect = root.getBoundingClientRect();
          const rootHeight = rootRect.height;

          if (rootHeight <= 0) {
            continue;
          }

          const rootTop = rootRect.top + window.scrollY;
          const usedInCurrentPage = rootTop % contentHeightPx;
          const remainingInCurrentPage = contentHeightPx - usedInCurrentPage;

          if (rootHeight < contentHeightPx - EPSILON) {
            const shouldMoveRoot =
              usedInCurrentPage > EPSILON &&
              rootHeight > remainingInCurrentPage - EPSILON;

            if (shouldMoveRoot) {
              const spacer = document.createElement('div');
              spacer.className = 'pdf-smart-spacer';
              spacer.setAttribute('aria-hidden', 'true');
              spacer.style.height = `${Math.max(
                0,
                remainingInCurrentPage + continuationTopOffsetPx
              )}px`;

              root.parentNode?.insertBefore(spacer, root);
            }

            continue;
          }

          root.classList.add('pdf-fragment-host');

          const level1Segments: HTMLElement[] = [];

          for (const child of Array.from(root.children)) {
            if (!(child instanceof HTMLElement)) {
              continue;
            }

            if (child.hasAttribute('data-pdf-segment')) {
              level1Segments.push(child);
            }
          }

          if (level1Segments.length === 0) {
            for (const child of Array.from(root.children)) {
              if (!(child instanceof HTMLElement)) {
                continue;
              }

              const tag = child.tagName;
              if (tag === 'SCRIPT' || tag === 'STYLE') {
                continue;
              }

              level1Segments.push(child);
            }
          }

          for (const segment of level1Segments) {
            segment.style.breakInside = 'avoid-page';
            segment.style.pageBreakInside = 'avoid';

            const segmentRect = segment.getBoundingClientRect();
            const segmentHeight = segmentRect.height;

            if (segmentHeight <= 0) {
              continue;
            }

            if (segmentHeight < contentHeightPx - EPSILON) {
              const segmentTop = segmentRect.top + window.scrollY;
              const used = segmentTop % contentHeightPx;
              const remaining = contentHeightPx - used;

              const shouldMoveSegment =
                used > EPSILON &&
                segmentHeight > remaining - EPSILON;

              if (shouldMoveSegment) {
                const spacer = document.createElement('div');
                spacer.className = 'pdf-smart-spacer';
                spacer.setAttribute('aria-hidden', 'true');
                spacer.style.height = `${Math.max(
                  0,
                  remaining + continuationTopOffsetPx
                )}px`;

                segment.parentNode?.insertBefore(spacer, segment);
              }

              continue;
            }

            const level2Segments: HTMLElement[] = [];

            for (const child of Array.from(segment.children)) {
              if (!(child instanceof HTMLElement)) {
                continue;
              }

              if (child.hasAttribute('data-pdf-segment')) {
                level2Segments.push(child);
              }
            }

            if (level2Segments.length === 0) {
              const tag = segment.tagName;

              if (tag === 'UL' || tag === 'OL') {
                for (const li of Array.from(segment.children)) {
                  if (li instanceof HTMLElement && li.tagName === 'LI') {
                    level2Segments.push(li);
                  }
                }
              } else if (tag === 'TABLE') {
                const rows = segment.querySelectorAll<HTMLElement>('tr');
                for (const row of Array.from(rows)) {
                  level2Segments.push(row);
                }
              } else {
                for (const child of Array.from(segment.children)) {
                  if (!(child instanceof HTMLElement)) {
                    continue;
                  }

                  const childTag = child.tagName;
                  if (childTag === 'SCRIPT' || childTag === 'STYLE') {
                    continue;
                  }

                  level2Segments.push(child);
                }
              }
            }

            for (const subSegment of level2Segments) {
              subSegment.style.breakInside = 'avoid-page';
              subSegment.style.pageBreakInside = 'avoid';

              const subRect = subSegment.getBoundingClientRect();
              const subHeight = subRect.height;

              if (subHeight <= 0) {
                continue;
              }

              if (subHeight >= contentHeightPx - EPSILON) {
                continue;
              }

              const subTop = subRect.top + window.scrollY;
              const used = subTop % contentHeightPx;
              const remaining = contentHeightPx - used;

              const shouldMoveSubSegment =
                used > EPSILON &&
                subHeight > remaining - EPSILON;

              if (!shouldMoveSubSegment) {
                continue;
              }

              const spacer = document.createElement('div');
              spacer.className = 'pdf-smart-spacer';
              spacer.setAttribute('aria-hidden', 'true');
              spacer.style.height = `${Math.max(
                0,
                remaining + continuationTopOffsetPx
              )}px`;

              subSegment.parentNode?.insertBefore(spacer, subSegment);
            }
          }
        }
      },
      {
        contentHeightPx: printableHeightPx,
        continuationTopOffsetCss: BrowserSmartLayoutOptimizer.CONTINUATION_TOP_OFFSET
      }
    );
  }
}