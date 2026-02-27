import { Command } from 'commander';

import type { CliPdfOptions } from '../../application/services/PdfRequestFactory';
import type { ConvertHtmlToPdfUseCase } from '../../application/use-cases/ConvertHtmlToPdfUseCase';

export function buildCli(useCase: ConvertHtmlToPdfUseCase): Command {
  const program = new Command();

  program
    .name('smart-html-pdf')
    .description('Convierte HTML a PDF con paginación inteligente.')
    .requiredOption('--input <path>', 'Archivo HTML de entrada')
    .option('--output <path>', 'Ruta del PDF de salida')
    .option('--page-size <size>', 'A4 | A5 | Letter | Carta | SinglePage', 'A4')
    .option('--margin <value>', 'Margen general, ejemplo: 12mm', '0')
    .option('--margin-top <value>', 'Margen superior')
    .option('--margin-right <value>', 'Margen derecho')
    .option('--margin-bottom <value>', 'Margen inferior')
    .option('--margin-left <value>', 'Margen izquierdo')
    .option('--smart', 'Activa el modo inteligente para evitar cortes semánticos')
    .option('--landscape', 'Modo horizontal')
    .option('--prefer-css-page-size', 'Respeta @page del CSS cuando exista')
    .option('--scale <value>', 'Escala de render (0.1 a 2)', '1')
    .option('--wait-for <ms>', 'Tiempo extra de espera en milisegundos', '0')
    .option('--no-print-background', 'Desactiva fondos en el PDF')
    .action(async (options: CliPdfOptions) => {
      await useCase.execute(options);
    });

  return program;
}