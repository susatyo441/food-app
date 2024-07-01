import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePostRequest1925057237730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'post_request',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'request',
            type: 'text',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'post_request',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_organization',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('post_request');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    await queryRunner.dropForeignKey('post_request', foreignKey);
    await queryRunner.dropTable('post_request');
  }
}
