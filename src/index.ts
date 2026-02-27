import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { PdfRequestFactory } from './application/services/PdfRequestFactory';
import { ConvertHtmlToPdfUseCase } from './application/use-cases/ConvertHtmlToPdfUseCase';
import { InputFileValidator } from './infrastructure/fs/InputFileValidator';
import { OutputPathResolver } from './infrastructure/fs/OutputPathResolver';
import { BrowserSmartLayoutOptimizer } from './infrastructure/layout/BrowserSmartLayoutOptimizer';
import { PageMetrics } from './infrastructure/layout/PageMetrics';
import { PlaywrightPdfRenderer } from './infrastructure/pdf/PlaywrightPdfRenderer';
import type { CliPdfOptions } from './application/services/PdfRequestFactory';

const app = express();
const port = Number(process.env.PORT ?? 3000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExt = ext === '.html' || ext === '.htm';
    const validMime =
      file.mimetype === 'text/html' || file.mimetype === 'application/xhtml+xml';

    if (validExt || validMime) {
      cb(null, true);
      return;
    }

    cb(new Error('Solo se permiten archivos .html o .htm'));
  }
});

function buildUseCase(): ConvertHtmlToPdfUseCase {
  const validator = new InputFileValidator();
  const outputPathResolver = new OutputPathResolver();
  const requestFactory = new PdfRequestFactory(outputPathResolver);
  const pageMetrics = new PageMetrics();
  const smartLayoutOptimizer = new BrowserSmartLayoutOptimizer();
  const renderer = new PlaywrightPdfRenderer(pageMetrics, smartLayoutOptimizer);

  return new ConvertHtmlToPdfUseCase(validator, requestFactory, renderer);
}

const useCase = buildUseCase();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post(
  '/api/pdf',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    let tempDir: string | undefined;

    try {
      if (!req.file) {
        res.status(400).json({
          error: 'Debes enviar un archivo en el campo "file".'
        });
        return;
      }

      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-html-pdf-'));

      const inputExtension = getSafeHtmlExtension(req.file.originalname);
      const inputPath = path.join(tempDir, `input${inputExtension}`);
      const outputPath = path.join(tempDir, 'output.pdf');

      await fs.writeFile(inputPath, req.file.buffer);

      const options: CliPdfOptions = {
        input: inputPath,
        output: outputPath,
        printBackground: getBooleanDefault(req.body.printBackground, true)
      };

      const pageSize = getString(req.body.pageSize);
      if (pageSize !== undefined) options.pageSize = pageSize;

      const margin = getString(req.body.margin);
      if (margin !== undefined) options.margin = margin;

      const marginTop = getString(req.body.marginTop);
      if (marginTop !== undefined) options.marginTop = marginTop;

      const marginRight = getString(req.body.marginRight);
      if (marginRight !== undefined) options.marginRight = marginRight;

      const marginBottom = getString(req.body.marginBottom);
      if (marginBottom !== undefined) options.marginBottom = marginBottom;

      const marginLeft = getString(req.body.marginLeft);
      if (marginLeft !== undefined) options.marginLeft = marginLeft;

      const smart = getBoolean(req.body.smart);
      if (smart !== undefined) options.smart = smart;

      const landscape = getBoolean(req.body.landscape);
      if (landscape !== undefined) options.landscape = landscape;

      const preferCssPageSize = getBoolean(req.body.preferCssPageSize);
      if (preferCssPageSize !== undefined) options.preferCssPageSize = preferCssPageSize;

      const scale = getString(req.body.scale);
      if (scale !== undefined) options.scale = scale;

      const waitFor = getString(req.body.waitFor);
      if (waitFor !== undefined) options.waitFor = waitFor;

      await useCase.execute(options);

      const pdfBuffer = await fs.readFile(outputPath);
      const downloadName = `${sanitizeBaseName(req.file.originalname)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.status(200).send(pdfBuffer);

      // const pdfBuffer = await fs.readFile(outputPath);
      // const fileName = `${sanitizeBaseName(req.file.originalname)}.pdf`;
      // const base64 = pdfBuffer.toString('base64');

      // res.status(200).json({
      //   ok: true,
      //   fileName,
      //   mimeType: 'application/pdf',
      //   sizeBytes: pdfBuffer.length,
      //   base64
      // });
    } catch (error) {
      next(error);
    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  }
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      error: `Error de carga: ${error.message}`
    });
    return;
  }

  const message =
    error instanceof Error ? error.message : 'Ocurrió un error inesperado.';

  res.status(400).json({ error: message });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on', 'si'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function getBooleanDefault(value: unknown, defaultValue: boolean): boolean {
  const parsed = getBoolean(value);
  return parsed ?? defaultValue;
}

function getSafeHtmlExtension(originalName: string): '.html' | '.htm' {
  const ext = path.extname(originalName).toLowerCase();
  return ext === '.htm' ? '.htm' : '.html';
}

function sanitizeBaseName(fileName: string): string {
  const base = path.basename(fileName, path.extname(fileName));
  const sanitized = base.replace(/[^a-zA-Z0-9-_]/g, '_');
  return sanitized.length > 0 ? sanitized : 'documento';
}