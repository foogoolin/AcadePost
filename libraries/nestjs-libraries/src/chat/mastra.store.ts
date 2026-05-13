import { PostgresStore } from '@mastra/pg';

export const pStore = new PostgresStore({
  id: 'acadepost-store',
  connectionString: process.env.DATABASE_URL!,
});
