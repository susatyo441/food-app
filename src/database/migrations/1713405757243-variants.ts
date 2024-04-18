import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Variants1713405757243 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'variants',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'post_id', type: 'int' }, // Foreign key column
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'stok', type: 'int', isNullable: false },
          { name: 'startAt', type: 'datetime', isNullable: true },
          { name: 'expiredAt', type: 'datetime', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Foreign key constraint
    await queryRunner.createForeignKey(
      'variants',
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('variants');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('post_id') !== -1,
    );
    await queryRunner.dropForeignKey('variants', foreignKey);
    await queryRunner.dropTable('variants');
  }
}
