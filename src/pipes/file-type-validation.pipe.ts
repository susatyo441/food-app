import { ParseFilePipe, PipeTransform } from '@nestjs/common';

export class ParseFilesPipe implements PipeTransform<Express.Multer.File[]> {
  constructor(private readonly pipe: ParseFilePipe) {}

  async transform(
    files: Express.Multer.File[] | { [key: string]: Express.Multer.File },
  ) {
    if (typeof files === 'object') {
      files = Object.values(files);
    }

    for (const file of files) await this.pipe.transform(file);

    return files;
  }
}
