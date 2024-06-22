// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path'; // Import join dari modul 'path'
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [join(__dirname, '../entities/*.entity{.ts,.js}')], // Sesuaikan dengan path dan ekstensi file entitas Anda
        synchronize: true,
        autoLoadEntities: true,
        migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
