import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
dotenvConfig({ path: '.env' });

const config = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: null,
  database: 'food-app',
  entities: [join(__dirname, '../entities/*.entity{.ts,.js}')], // Sesuaikan dengan path dan ekstensi file entitas Anda
  synchronize: true,
  autoLoadEntities: true,
  migrations: [join(__dirname, '../database/migrations/*.ts')],
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
