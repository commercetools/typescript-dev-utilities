import {
  ClientBuilder,
  type ClientResponse,
  type ClientRequest,
} from '@commercetools/ts-client';
import {
  createApiBuilderFromCtpClient,
  ByProjectKeyCustomObjectsRequestBuilder,
} from '@commercetools/platform-sdk';
import { MethodNames } from '../../../src/utils/types';
import { type ApiConfigOptions } from '../../../src/utils/types';

export function clearData(
  apiConfig: ApiConfigOptions,
  entityName: MethodNames,
  predicate = null
) {
  const client = new ClientBuilder()
    .withClientCredentialsFlow({ ...apiConfig })
    .withHttpMiddleware({ host: apiConfig.apiUrl })
    .withConcurrentModificationMiddleware()
    .build();

  const builder = createApiBuilderFromCtpClient(client).withProjectKey({
    projectKey: apiConfig.projectKey,
  });

  const service = builder[entityName as MethodNames]();

  const request: ClientRequest = service
    .get(predicate ? { queryArgs: { where: predicate } } : {})
    .clientRequest();

  return client.process(
    request,
    (payload: ClientResponse): Promise<unknown> => {
      // Built-in states cannot be deleted
      const results =
        entityName === 'states'
          ? payload.body?.results.filter((state) => state.builtIn === false)
          : payload.body.results;

      return Promise.all(
        results.map((result): Promise<ClientResponse<unknown[]>> => {
          let request: ClientRequest;

          if (service instanceof ByProjectKeyCustomObjectsRequestBuilder) {
            request = service
              .withContainerAndKey({
                key: result.key,
                container: result.container,
              })
              .delete({ queryArgs: { version: result.version } })
              .clientRequest();
          } else {
            request = service
              .withId({ ID: result.id })
              .delete({ queryArgs: { version: result.version } })
              .clientRequest();
          }

          return client.execute(request);
        })
      );
    }
  );
}

export async function createData(
  apiConfig: ApiConfigOptions,
  entityName: MethodNames,
  data,
  id?: string
) {
  const client = new ClientBuilder()
    .withClientCredentialsFlow({ ...apiConfig })
    .withHttpMiddleware({ host: apiConfig.apiUrl })
    .withConcurrentModificationMiddleware()
    .build();

  const builder = createApiBuilderFromCtpClient(client).withProjectKey({
    projectKey: apiConfig.projectKey,
  });

  const service = builder[entityName as MethodNames]();

  const _data = await Promise.all(
    data.map((datum) => {
      let request: ClientRequest;
      if (id) {
        if (service instanceof ByProjectKeyCustomObjectsRequestBuilder) {
          request = service
            .post({ body: datum, queryArgs: { where: `ID="${id}"` } })
            .clientRequest();
        } else {
          request = service
            .withId({ ID: id })
            .post({ body: datum })
            .clientRequest();
        }
      } else {
        request = service.post({ body: datum }).clientRequest();
      }

      return client.execute(request);
    })
  );

  return _data;
}
