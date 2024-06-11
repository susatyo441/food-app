import { DataSource } from 'typeorm';
import { Category } from '../../entities/category.entity'; // Sesuaikan path jika diperlukan

export class CategorySeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    console.log('Seeding categories...');
    const categoryRepository = dataSource.getRepository(Category);

    await categoryRepository.save([
      { name: 'Berkuah' },
      { name: 'Makanan Kering' },
      { name: 'Buah-buahan/Sayuran' },
      { name: 'Makanan Kemasan' },
      { name: 'Karbohidrat' },
      { name: 'Lauk Pauk' },
      { name: 'Cemilan/Minuman' },
    ]);

    console.log('Categories seeded');
  }
}
