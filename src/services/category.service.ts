// src/address/address.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async find(ids: number[]): Promise<Category[]> {
    const categories = await this.categoryRepository.findByIds(ids);
    if (!categories || categories.length === 0) {
      throw new NotFoundException('Categories not found');
    }
    return categories;
  }
}
