import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../entities/recipe.entity';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('recipes')
@UseGuards(AuthGuard)
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  async create(
    @Body() recipeData: Partial<Recipe>,
    @Req() request,
  ): Promise<Recipe> {
    const userId = request.user.id; // Assuming you have user info in request, adjust as necessary
    return await this.recipeService.create(recipeData, userId);
  }

  @Get()
  async findAll(@Req() request): Promise<Recipe[]> {
    return await this.recipeService.findAll(request.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Req() request): Promise<Recipe> {
    return await this.recipeService.findOne(id, request.user.id);
  }
}
