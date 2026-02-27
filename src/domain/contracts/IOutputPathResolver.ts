export interface IOutputPathResolver {
  resolve(inputPath: string, outputPath?: string): string;
}