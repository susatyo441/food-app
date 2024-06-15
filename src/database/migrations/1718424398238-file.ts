import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class FilesTable1723456789020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'files',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_id', type: 'int', isNullable: false }, // Foreign key column
          { name: 'file_path', type: 'varchar', isNullable: false },
          { name: 'file_name', type: 'varchar', isNullable: false },
          { name: 'file_type', type: 'varchar', isNullable: true },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Foreign key constraints
    await queryRunner.createForeignKey(
      'files',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('files');
    const foreignKey1 = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );

    await queryRunner.dropForeignKey('files', foreignKey1);

    await queryRunner.dropTable('files');
  }
}
