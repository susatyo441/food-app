// src/modules/app.module.ts

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller'; // Import AuthController
import { AuthService } from '../services/auth.service'; // Import AuthService
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    JwtModule.register({
      secret: 'AEA9448136237662FAC22EE5212C8',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  providers: [UserService, AuthService], // Tambahkan AuthService ke dalam providers
  controllers: [UserController, AuthController], // Tambahkan AuthController ke dalam controllers
  exports: [TypeOrmModule]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('users'); // Ganti dengan route yang ingin dilindungi oleh middleware ini
  }
}
