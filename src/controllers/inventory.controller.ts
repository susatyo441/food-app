import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { Inventory } from '../entities/inventory.entity';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import * as mime from 'mime-types';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'public/files';
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          let fileExtension = mime.extension(file.mimetype);
          if (fileExtension === 'bin') {
            fileExtension = 'jpeg'; // Rename bin to jpeg
          }
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
    }),
  )
  async createInventory(
    @Req() req,
    @Body() inventoryData: Partial<Inventory>,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<Inventory> {
    const userId = req.user.id; // Assuming user id is stored in request
    const url = this.configService.get<string>('URL');
    const mediaUrl = `${url}/${image.path
      .replace(/\\/g, '/')
      .replace('public/', '')}`;
    return this.inventoryService.createInventory(
      userId,
      inventoryData,
      mediaUrl,
    );
  }

  @Get()
  async getInventories(@Req() req): Promise<Inventory[]> {
    const userId = req.user.id; // Assuming user id is stored in request
    return this.inventoryService.getInventories(userId);
  }

  @Get('find/:id')
  async findInventoryById(
    @Req() req,
    @Param('id') id: number,
  ): Promise<Inventory> {
    const userId = req.user.id; // Assuming user id is stored in request
    return this.inventoryService.findInventoryById(userId, id);
  }

  @Put('update/:id')
  async updateQuantity(
    @Req() req,
    @Param('id') id: number,
    @Body('quantity') quantity: number,
    @Body('expiredAt') expiredAt: Date,
  ): Promise<Inventory> {
    const userId = req.user.id; // Assuming user id is stored in request
    return this.inventoryService.updateQuantity(
      userId,
      id,
      quantity,
      expiredAt,
    );
  }

  @Delete('delete/:id')
  async deleteInventory(@Req() req, @Param('id') id: number): Promise<any> {
    const userId = req.user.id; // Assuming user id is stored in request
    await this.inventoryService.deleteInventory(userId, id);
    return { success: true, message: 'Berhasil hapus inventory' };
  }

  @Get('/expired')
  async getExpiredInventories(@Req() req): Promise<Inventory[]> {
    const userId = req.user.id;
    return this.inventoryService.getExpiredInventories(userId);
  }

  @Get('/zero-quantity')
  async getInventoriesWithZeroQuantity(@Req() req): Promise<Inventory[]> {
    const userId = req.user.id;
    return this.inventoryService.getInventoriesWithZeroQuantity(userId);
  }

  @Get('/valid')
  async getValidInventories(@Req() req): Promise<Inventory[]> {
    const userId = req.user.id;
    return this.inventoryService.getValidInventories(userId);
  }
}
