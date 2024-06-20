import { DataSource } from 'typeorm';
import { Points } from '../../entities/point.entity';
import { User } from '../../entities/user.entity'; // Adjust the import path as necessary

export class PointSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    console.log('Seeding point...');

    const userRepository = dataSource.getRepository(User);
    const pointsRepository = dataSource.getRepository(Points);

    // Find or create a user
    let user = await userRepository.findOneBy({ id: 1 });
    if (!user) {
      user = new User();
      user.name = 'Default User'; // Add any other required user fields here
      user = await userRepository.save(user);
    }

    // Create points associated with the user
    const points = new Points();
    points.points = 0;
    points.user = user;
    await pointsRepository.save(points);

    console.log('Point seeded');
  }
}
