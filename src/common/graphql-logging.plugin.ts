// src/common/graphql-logging.plugin.ts
import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLRequestListener } from '@apollo/server';

export function GraphQLLoggingPlugin(): ApolloServerPlugin {
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async willSendResponse(requestContext) {
          if (requestContext.errors) {
            requestContext.errors.forEach((err) => {
              const info = err?.extensions?.info as { parentType?: { name: string }, fieldName?: string };
              console.error(
                'Error in',
                info?.parentType?.name,
                info?.fieldName,
                err,
              );
            });
          }
        },
      };
    },
  };
}
