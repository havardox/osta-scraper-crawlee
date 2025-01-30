import { Dataset } from 'crawlee';

export async function openDataset(): Promise<Dataset> {
  const dataset = await Dataset.open('OstaDataset');
  return dataset;
}

export async function dropDataset(): Promise<void> {
  const dataset = await openDataset();
  await dataset.drop();
}
