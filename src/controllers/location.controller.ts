import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';

import { LocationService } from '../services/location.service';
import { UpdateLocationDto } from '../dto/location.dto';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('location')
@UseGuards(AuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Req() req,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.locationService.updateLocation(
      updateLocationDto.transactionId,
      updateLocationDto.lat,
      updateLocationDto.lon,
      userId,
    );
    return { message: 'Sukses update lokasi' };
  }

  @Get('recipient/:transactionId')
  async getRecipientLocation(
    @Param('transactionId') transactionId: number,
    @Req() req,
  ): Promise<{ lat: number; lon: number }> {
    const userId = req.user.id;
    return this.locationService.getRecipientLocation(transactionId, userId);
  }
}
