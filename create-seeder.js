const fs = require('fs');
const path = require('path');

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const seederName = process.argv[2]; // Mengambil nama seeder dari argumen CLI
if (!seederName) {
  console.error('Please provide a seeder name.');
  process.exit(1);
}

const capitalizedSeederName = capitalizeFirstLetter(seederName);
const lowercasedSeederName = seederName.toLowerCase();
const seederPath = path.join(
  __dirname,
  'src/database/seeders',
  `${capitalizedSeederName}.seeder.ts`,
);

const seederTemplate = `
import { DataSource } from 'typeorm';
import { ${capitalizedSeederName} } from '../../entities/${lowercasedSeederName}.entity';

export class ${capitalizedSeederName}Seeder {
  public static async run(dataSource: DataSource): Promise<void> {
    console.log('Seeding ${capitalizedSeederName.toLowerCase()}...');
    const repository = dataSource.getRepository(${capitalizedSeederName});

    await repository.save([
      // Define default objects to insert here
      { name: 'Example 1' },
      { name: 'Example 2' }
    ]);

    console.log('${capitalizedSeederName} seeded');
  }
}
`;

fs.writeFile(seederPath, seederTemplate, (err) => {
  if (err) {
    console.error('Error creating seeder file:', err);
    return;
  }
  console.log(`Seeder file created at: ${seederPath}`);
});
