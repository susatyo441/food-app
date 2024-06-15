import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Users1713404869357 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'email', type: 'varchar', isNullable: false },
          { name: 'password', type: 'varchar', isNullable: false },
          { name: 'gender', type: 'enum', enum: ['l', 'p'], isNullable: false },
          {
            name: 'profile_picture',
            type: 'varchar',
            isNullable: false,
            default:
              "'https://static.vecteezy.com/system/resources/previews/026/630/551/original/profile-icon-symbol-design-illustration-vector.jpg'",
          },
          {
            name: 'token',
            type: 'text',
            default: null,
            isNullable: true,
          },
          {
            name: 'isDeleted',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'fcmToken',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
