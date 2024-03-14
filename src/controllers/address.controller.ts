// src/address/address.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Req, UseGuards } from '@nestjs/common';
import { AddressService } from '../services/address.service';
import { AuthGuard } from '../guard/auth.guard';
import { CreateAddressDto } from '../dto/address.dto';
import { Address } from '../entities/address.entity';

@Controller('address')
@UseGuards(AuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Body() createAddressDto: CreateAddressDto, @Req() req): Promise<Address> {
    const userId = req.user.id; // Assume user id is stored in request object
    return this.addressService.create(createAddressDto, userId);
  }

  @Get()
  findAll(@Req() req): Promise<Address[]> {
    const userId = req.user.id; // Assume user id is stored in request object
    return this.addressService.findAllByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Address> {
    return this.addressService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAddressDto: CreateAddressDto, @Req() req): Promise<Address> {
    const userId = req.user.id;
    return this.addressService.update(+id, updateAddressDto,userId );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.addressService.remove(+id);
  }
}
