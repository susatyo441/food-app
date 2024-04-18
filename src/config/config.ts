import { DataSource } from 'typeorm';
import { join } from 'path';
const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: null,
  database: 'food-app',
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
