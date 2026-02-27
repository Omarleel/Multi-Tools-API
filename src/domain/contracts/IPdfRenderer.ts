import { PdfRequest } from "../models/PdfRequest";

export interface IPdfRenderer {
  render(request: PdfRequest): Promise<void>;
}