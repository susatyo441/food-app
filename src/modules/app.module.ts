// src/modules/app.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller'; // Import AuthController
import { AuthService } from '../services/auth.service'; // Import AuthService
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AddressController } from 'src/controllers/address.controller';
import { AddressService } from 'src/services/address.service';
import { Address } from 'src/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address]),
    ConfigModule,
    JwtModule.register({
      global: true,
      secret: 'AEA9448136237662FAC22EE5212C8',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  providers: [UserService, AuthService, AddressService], // Tambahkan AuthService ke dalam providers
  controllers: [UserController, AuthController, AddressController], // Tambahkan AuthController ke dalam controllers
  exports: [TypeOrmModule]
})
export class AppModule {}
