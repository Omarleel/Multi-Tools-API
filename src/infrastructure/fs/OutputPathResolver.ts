import path from 'node:path';

import type { IOutputPathResolver } from '../../domain/contracts/IOutputPathResolver';

export class OutputPathResolver implements IOutputPathResolver {
  public resolve(inputPath: string, outputPath?: string): string {
    if (outputPath && outputPath.trim().length > 0) {
      const normalized = outputPath.toLowerCase().endsWith('.pdf') ? outputPath : `${outputPath}.pdf`;
      return path.resolve(normalized);
    }

    const directory = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));

    return path.resolve(directory, `${baseName}.pdf`);
  }
}