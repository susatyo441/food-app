import { DataSource } from 'typeorm';
import { Category } from '../../entities/category.entity'; // Sesuaikan path jika diperlukan

export class CategorySeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    console.log('Seeding categories...');
    const categoryRepository = dataSource.getRepository(Category);

    await categoryRepository.save([{ name: 'Kering' }, { name: 'Basah' }]);

    console.log('Categories seeded');
  }
}
