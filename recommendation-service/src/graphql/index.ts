import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

export async function createApolloServer(deps) {
  const typeDefs = mergeTypeDefs(loadFilesSync('./src/graphql/schema/typeDefs'));
  const resolvers = mergeResolvers(loadFilesSync('./src/graphql/schema/resolvers'));

  return new ApolloServer({
    typeDefs,
    resolvers,
  });
}
