import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '../entities/*.entity{.ts,.js}')], // Sesuaikan dengan path dan ekstensi file entitas Anda
  synchronize: true,
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
