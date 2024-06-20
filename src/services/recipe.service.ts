import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entities/recipe.entity';
import { User } from '../entities/user.entity'; // Adjust the import path as necessary

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(recipeData: Partial<Recipe>, userId: number): Promise<Recipe> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const recipe = this.recipeRepository.create({
      ...recipeData,
      user,
    });
    return await this.recipeRepository.save(recipe);
  }

  async findAll(userId: number): Promise<Recipe[]> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    return await this.recipeRepository.findBy({ user });
  }

  async findOne(id: number, userId: number): Promise<Recipe> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    return await this.recipeRepository.findOne({
      where: { user },
    });
  }
}
