import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserOrganization1925057201730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_organization',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'profile_picture',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lat',
            type: 'double precision',
          },
          {
            name: 'long',
            type: 'double precision',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'address',
            type: 'varchar',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_organization');
  }
}
