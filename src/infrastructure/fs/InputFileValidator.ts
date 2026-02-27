import fs from 'node:fs/promises';
import path from 'node:path';

import type { IInputFileValidator } from '../../domain/contracts/IInputFileValidator';
import { ValidationError } from '../../domain/errors/ValidationError';

export class InputFileValidator implements IInputFileValidator {
  public async validate(inputPath: string): Promise<void> {
    const resolvedPath = path.resolve(inputPath);

    let stats;
    try {
      stats = await fs.stat(resolvedPath);
    } catch {
      throw new ValidationError(`El archivo de entrada no existe: ${resolvedPath}`);
    }

    if (!stats.isFile()) {
      throw new ValidationError(`La ruta de entrada no es un archivo: ${resolvedPath}`);
    }

    const extension = path.extname(resolvedPath).toLowerCase();
    if (extension !== '.html' && extension !== '.htm') {
      throw new ValidationError('El archivo de entrada debe tener extensión .html o .htm.');
    }
  }
}