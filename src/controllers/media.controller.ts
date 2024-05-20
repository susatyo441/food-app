import {
  Controller,
  Post,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ParseFilesPipe } from '../pipes/file-type-validation.pipe';
import { v4 as uuidv4 } from 'uuid';
import * as mimeTypes from 'mime-types';

@Controller('media')
export class MediaController {
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: 'public/media',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const fileExtension = mimeTypes.extension(file.mimetype); // Dapatkan ekstensi file berdasarkan tipe MIME
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Filter file hanya untuk tipe MIME image
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Please upload only images.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFiles(
      new ParseFilesPipe(
        new ParseFilePipeBuilder()
          .addFileTypeValidator({
            fileType: /(jpg|jpeg|png)$/,
          })
          .addMaxSizeValidator({ maxSize: 5242880 })
          .build({
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          }),
      ),
    )
    images: Express.Multer.File[],
  ) {
    return await this.saveFilesToStorage(images);
  }

  @Post('upload-pfp')
  @UseInterceptors(
    FilesInterceptor('images', 1, {
      storage: diskStorage({
        destination: 'public/profile_picture',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const fileExtension = mimeTypes.extension(file.mimetype); // Dapatkan ekstensi file berdasarkan tipe MIME
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Filter file hanya untuk tipe MIME image
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Please upload only images.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFilePFP(
    @UploadedFiles(
      new ParseFilesPipe(
        new ParseFilePipeBuilder()
          .addFileTypeValidator({
            fileType: /(jpg|jpeg|png)$/,
          })
          .addMaxSizeValidator({ maxSize: 5242880 })
          .build({
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          }),
      ),
    )
    images: Express.Multer.File[],
  ) {
    return await this.saveFilesToStorage(images);
  }

  private async saveFilesToStorage(
    files: Array<Express.Multer.File>,
  ): Promise<string[]> {
    const fileUrls: string[] = [];
    for (const file of files) {
      const fileUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/').replace('public/', '')}`;
      fileUrls.push(fileUrl);
    }
    return fileUrls;
  }
}
