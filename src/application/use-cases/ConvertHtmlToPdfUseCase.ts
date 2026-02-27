import type { CliPdfOptions, PdfRequestFactory } from '../services/PdfRequestFactory';
import type { IInputFileValidator } from '../../domain/contracts/IInputFileValidator';
import type { IPdfRenderer } from '../../domain/contracts/IPdfRenderer';

export class ConvertHtmlToPdfUseCase {
  public constructor(
    private readonly inputFileValidator: IInputFileValidator,
    private readonly requestFactory: PdfRequestFactory,
    private readonly pdfRenderer: IPdfRenderer
  ) {}

  public async execute(options: CliPdfOptions): Promise<void> {
    await this.inputFileValidator.validate(options.input);

    const request = this.requestFactory.fromCli(options);
    await this.pdfRenderer.render(request);

    console.info(`PDF generado correctamente: ${request.outputPath}`);
  }
}