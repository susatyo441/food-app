import { connectionSource } from '../../config/typeorm'; // Sesuaikan path jika diperlukan
import { UserSeeder } from './user.seeder';
import { CategorySeeder } from './category.seeder';

async function run() {
  await connectionSource.initialize();
  try {
    await UserSeeder.run(connectionSource);
    await CategorySeeder.run(connectionSource);
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during data seed:', error);
  } finally {
    await connectionSource.destroy();
  }
}

run().catch((error) => {
  console.error('Error during data seed:', error);
  process.exit(1);
});
