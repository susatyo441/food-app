// src/address/address.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
  UseGuards,
  HttpStatus,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { AddressService } from '../services/address.service';
import { AuthGuard } from '../guard/auth.guard';
import { CreateAddressDto } from '../dto/address.dto';
import { Address } from '../entities/address.entity';

@Controller('address')
@UseGuards(AuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(
    @Body() createAddressDto: CreateAddressDto,
    @Req() req,
  ): Promise<Address> {
    const userId = req.user.id; // Assume user id is stored in request object
    return this.addressService.create(createAddressDto, userId);
  }

  @Get()
  findAll(@Req() req): Promise<Address[]> {
    const userId = req.user.id; // Assume user id is stored in request object
    return this.addressService.findAllByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req): Promise<Address> {
    return this.addressService.findOne(+id, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAddressDto: CreateAddressDto,
    @Req() req,
  ): Promise<Address> {
    const userId = req.user.id;
    return this.addressService.update(+id, updateAddressDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req, @Res() res): Promise<void> {
    try {
      await this.addressService.remove(+id, req.user.id);
      res
        .status(HttpStatus.OK)
        .json({ message: 'Address deleted successfully' });
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
      } else {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'An error occurred while deleting the address' });
      }
    }
  }
}
