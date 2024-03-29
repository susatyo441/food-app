// src/address/address.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';
import { CreateAddressDto } from '../dto/address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(
    createAddressDto: CreateAddressDto,
    userId: number,
  ): Promise<Address> {
    const address = this.addressRepository.create({
      ...createAddressDto,
      user: { id: userId },
    });
    return this.addressRepository.save(address);
  }

  async findAllByUserId(userId: number): Promise<Address[]> {
    return this.addressRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(id: number, user_id: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { user: { id: user_id }, id: id },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async update(
    id: number,
    updateAddressDto: CreateAddressDto,
    user_id: number,
  ): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { user: { id: user_id }, id: id },
    });

    this.addressRepository.merge(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async remove(id: number, user_id: number): Promise<{ message: string }> {
    const address = await this.addressRepository.findOneOrFail({
      where: { user: { id: user_id }, id: id },
    });

    await this.addressRepository.delete(address.id);

    return { message: 'Address deleted successfully' };
  }
}
