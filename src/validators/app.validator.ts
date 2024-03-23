import { FileValidator } from '@nestjs/common';
import { parse } from 'file-type-mime';

export interface CustomUploadTypeValidatorOptions {
  fileType: string[];
}

export class CustomUploadFileTypeValidator extends FileValidator {
  private _allowedMimeTypes: string[];

  constructor(
    protected readonly validationOptions: CustomUploadTypeValidatorOptions,
  ) {
    super(validationOptions);
    this._allowedMimeTypes = this.validationOptions.fileType;
  }

  public isValid(files?: Express.Multer.File): boolean {
    const result = parse(files.buffer);
    return this._allowedMimeTypes.includes(result.mime);
  }

  public buildErrorMessage(): string {
    return `Upload not allowed. Upload only files of type: ${this._allowedMimeTypes.join(
      ', ',
    )}`;
  }
}
