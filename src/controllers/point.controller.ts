import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { PointService } from '../services/point.service';
import { ExtendService } from '../services/extend.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { UserService } from 'src/services/user.service';

@Controller('points')
export class PointController {
  constructor(
    private readonly pointService: PointService,
    private readonly extendService: ExtendService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async getCurrentPoints(@Req() req): Promise<any> {
    const userId = req.user.id;
    return await this.pointService.getPoints(userId);
  }

  @UseGuards(AuthGuard)
  @Post('extend')
  async createExtend(@Req() req): Promise<any> {
    const amount = 20;
    const userId = req.user.id;
    return await this.extendService.createExtend(userId, amount);
  }

  @UseGuards(AuthGuard)
  @Get('extend')
  async getUserExtends(@Req() req): Promise<any> {
    const userId = req.user.id;
    return await this.extendService.countValidExtend(userId);
  }

  @UseGuards(AuthGuard)
  @Post('plus')
  async plusPoint(@Req() req, @Body('points') points: number): Promise<any> {
    const userId = req.user.id;
    const user = await this.userService.findById(userId);

    return await this.pointService.tambahPoint(user, points);
  }
}
