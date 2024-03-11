// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';  // Import join dari modul 'path'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: null,
      database: 'food-app',
      entities: [join(__dirname, '../entities/*.entity{.ts,.js}')],  // Sesuaikan dengan path dan ekstensi file entitas Anda
      synchronize: true,
    }),
  ],
})
export class ConfigModule {}
