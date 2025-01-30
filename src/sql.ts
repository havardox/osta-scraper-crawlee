import { Glob } from 'glob';
import { readFile } from 'fs/promises';
import pg from 'pg';

// Read database configuration from environment variables
const { DB_HOST, DB_PORT, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD } = process.env;

// Validate required environment variables
if (!DB_HOST || !DB_PORT || !DB_DATABASE_NAME || !DB_USERNAME || !DB_PASSWORD) {
  throw new Error('Missing one or more required database environment variables.');
}

const client = new pg.Client({
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE_NAME,
});
// Batch size
const BATCH_SIZE = 1000;

async function main() {
  // Connect to PostgreSQL
  await client.connect();

  // Create table if it doesn't exist
  await client.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        url TEXT,
        title TEXT,
        description TEXT
        category SMALLINT
      )
    `);

  // Directory containing JSON files
  const directoryPath = '/home/node/app/src/dist/data/datasets/OstaDataset'; // Absolute path from .env

  // Use Node.js built-in glob for matching files
  const files: string[] = [];

  const globbedFiles = new Glob(`${directoryPath}/**/*.json`, {});
  // eslint-disable-next-line no-restricted-syntax
  for (const file of globbedFiles) {
    files.push(file.toString());
  }

  console.log(`Found ${files.length} JSON files.`);

  // Read and collect data from JSON files
  // eslint-disable-next-line no-restricted-syntax
  // Read all files in parallel
  const allRecords = await Promise.all(
    files.map(async (file) => {
      const data = await readFile(file, 'utf-8'); // Read file content
      return data; // Return raw file content as a string
    }),
  );

  console.log(`allRecords length is ${allRecords.length}`);

  console.log(`First 10 records: ${allRecords.slice(0, 2)}`);

  const allRecordsJson = allRecords.map((record, index) => {
    try {
      return JSON.parse(record);
    } catch (error: any) {
      console.error(`Failed to parse JSON for record at index ${index}:`, record);
      console.error('Error details:', error.message);
      return null; // Or handle it differently, e.g., skip or use a fallback object
    }
  });

  console.log(`Loaded ${allRecordsJson.length} records into memory.`);

  // Insert data in batches
  for (let i = 0; i < allRecordsJson.length; i += BATCH_SIZE) {
    // Extract the batch
    const batch = allRecordsJson.slice(i, i + BATCH_SIZE);

    // Filter out invalid records first
    const validRecords = batch.filter(
      (record) =>
        record &&
        typeof record.url === 'string' &&
        typeof record.title === 'string' &&
        typeof record.description === 'string',
    );

    // Build `values` array from valid records
    const values: any[] = [];
    validRecords.forEach((record) => {
      values.push(record.url, record.title, record.description);
    });

    // Build placeholders based on the *number of valid records*
    const placeholders = validRecords
      .map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`)
      .join(', ');

    // If validRecords is empty, skip the insert entirely
    if (validRecords.length === 0) {
      console.log(`No valid records in batch ${Math.ceil((i + 1) / BATCH_SIZE)}. Skipping.`);
      // eslint-disable-next-line no-continue
      continue;
    }

    const query = `
    INSERT INTO records (url, title, description)
    VALUES ${placeholders}
  `;

    // eslint-disable-next-line no-await-in-loop
    await client.query(query, values);

    console.log(
      `Inserted batch ${Math.ceil((i + 1) / BATCH_SIZE)} of ${Math.ceil(
        allRecordsJson.length / BATCH_SIZE,
      )}.`,
    );
  }

  console.log('All records inserted successfully.');

  // Remove duplicate rows based on the `url` column, keeping the first
  await client.query(`
      DELETE FROM records
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM records
        GROUP BY url
      )
    `);

  console.log('Duplicates removed successfully.');
  // Close the connection
  await client.end();
}

main();
