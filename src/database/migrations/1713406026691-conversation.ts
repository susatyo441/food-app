import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Conversation1713406026691 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_id_donor', type: 'int' }, // Foreign key column
          { name: 'user_id_recipient', type: 'int' }, // Foreign key column
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
    await queryRunner.createForeignKeys('conversations', [
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
    const table = await queryRunner.getTable('conversations');
    const foreignKey1 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id_donor') !== -1,
    );
    const foreignKey2 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id_recipient') !== -1,
    );

    await queryRunner.dropForeignKey('conversations', foreignKey1);
    await queryRunner.dropForeignKey('conversations', foreignKey2);

    await queryRunner.dropTable('conversations');
  }
}
