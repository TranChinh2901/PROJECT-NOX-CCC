import 'dotenv/config';
import { createApp } from './app.js';
import { createApolloServer } from './graphql/index.js';
import { pool } from './config/database.js';
import { redis } from './config/redis.js';
import { env } from './config/env.js';

async function main() {
  const app = createApp();
  const apolloServer = await createApolloServer({ db: pool, redis });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT}/graphql`);
  });
}

main().catch(console.error);
