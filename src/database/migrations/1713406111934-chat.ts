import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Chat1713406111934 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chats',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'conversation_id', type: 'int' }, // Foreign key column
          { name: 'message', type: 'text', isNullable: false },
          { name: 'type', type: 'int', isNullable: false },
          { name: 'readAt', type: 'datetime', isNullable: false },
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
      'chats',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('chats');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('conversation_id') !== -1,
    );
    await queryRunner.dropForeignKey('chats', foreignKey);
    await queryRunner.dropTable('chats');
  }
}
