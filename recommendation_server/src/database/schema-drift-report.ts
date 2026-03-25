import { AppDataSource } from '@/config/database.config';

const parseLimit = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 50;
};

async function main(): Promise<void> {
  const queryLimit = parseLimit(process.env.SCHEMA_DRIFT_LIMIT);

  await AppDataSource.initialize();

  try {
    const sqlInMemory = await AppDataSource.driver.createSchemaBuilder().log();

    console.log(`Database type: ${AppDataSource.options.type}`);
    console.log(`Schema drift queries: ${sqlInMemory.upQueries.length}`);

    if (sqlInMemory.upQueries.length === 0) {
      console.log('Entity metadata matches the current schema.');
      return;
    }

    console.log(`Showing first ${Math.min(queryLimit, sqlInMemory.upQueries.length)} queries:`);
    for (const [index, query] of sqlInMemory.upQueries.slice(0, queryLimit).entries()) {
      console.log(`${index + 1}. ${query.query}`);
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error('Failed to generate schema drift report.');
  console.error(error);
  process.exit(1);
});
