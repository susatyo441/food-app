import { DataSource } from 'typeorm';
import { User, Gender } from '../../entities/user.entity'; // Sesuaikan path jika diperlukan
import * as bcrypt from 'bcrypt';

export class UserSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    console.log('Seeding users...');
    const userRepository = dataSource.getRepository(User);

    await userRepository.save([
      {
        name: 'Admin',
        email: 'admin@admin.com',
        password: await bcrypt.hash('admin123', 10), // Harus di-hash sebelum digunakan di produksi
        gender: Gender.l,
      },
    ]);

    console.log('Users seeded');
  }
}
