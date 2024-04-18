import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Transactions1713405915991 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'post_id', type: 'int' }, // Foreign key column
          { name: 'user_id_donor', type: 'int' }, // Foreign key column
          { name: 'user_id_recipient', type: 'int' }, // Foreign key column
          { name: 'detail', type: 'text', isNullable: false },
          { name: 'timeline', type: 'text', isNullable: true },
          { name: 'status', type: 'int', isNullable: true },
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

    // Foreign key constraints
    await queryRunner.createForeignKeys('transactions', [
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['user_id_donor'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['user_id_recipient'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('transactions');
    const foreignKey1 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('post_id') !== -1,
    );
    const foreignKey2 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id_donor') !== -1,
    );
    const foreignKey3 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id_recipient') !== -1,
    );

    await queryRunner.dropForeignKey('transactions', foreignKey1);
    await queryRunner.dropForeignKey('transactions', foreignKey2);
    await queryRunner.dropForeignKey('transactions', foreignKey3);

    await queryRunner.dropTable('transactions');
  }
}
