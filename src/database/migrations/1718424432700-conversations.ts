import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class ConversationsTable1723456789040 implements MigrationInterface {
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
          { name: 'user1_id', type: 'int', isNullable: false }, // Foreign key column
          { name: 'user2_id', type: 'int', isNullable: false }, // Foreign key column
          { name: 'last_message_id', type: 'int', isNullable: true }, // Foreign key column
          {
            name: 'last_update',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_conversation_users',
            columnNames: ['user1_id', 'user2_id'],
          },
        ],
      }),
    );

    // Foreign key constraints
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['user1_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['user2_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['last_message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('conversations');
    const foreignKey1 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user1_id') !== -1,
    );
    const foreignKey2 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user2_id') !== -1,
    );
    const foreignKey3 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('last_message_id') !== -1,
    );

    await queryRunner.dropForeignKey('conversations', foreignKey1);
    await queryRunner.dropForeignKey('conversations', foreignKey2);
    await queryRunner.dropForeignKey('conversations', foreignKey3);

    await queryRunner.dropTable('conversations');
  }
}
