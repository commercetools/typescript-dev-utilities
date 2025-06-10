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

  let request: ClientRequest;
  const service = builder[entityName as MethodNames]();

  // check for custom objects
  if (service instanceof ByProjectKeyCustomObjectsRequestBuilder) {
    request = service.get({ queryArgs: { where: predicate } }).clientRequest();
  }

  request = service
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
          let request;
          if (service instanceof ByProjectKeyCustomObjectsRequestBuilder) {
            request = service
              .withContainerAndKey({
                container: result.container,
                key: result.key,
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
            .post({ body: datum, queryArgs: { where: `id="${id}"` } })
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

export async function getId(
  apiConfig: ApiConfigOptions,
  entityName: MethodNames
): Promise<string> {
  const client = new ClientBuilder()
    .withClientCredentialsFlow({ ...apiConfig })
    .withHttpMiddleware({ host: apiConfig.apiUrl })
    .build();

  const builder = createApiBuilderFromCtpClient(client).withProjectKey({
    projectKey: apiConfig.projectKey,
  });

  const service = builder[entityName]();

  const request = {
    ...service.get().clientRequest(),
  };

  return client
    .execute(request)
    .then((result) => Promise.resolve(result.body.results[0].id));
}
