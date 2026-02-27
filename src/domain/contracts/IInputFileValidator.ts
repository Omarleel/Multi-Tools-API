export interface IInputFileValidator {
  validate(inputPath: string): Promise<void>;
}