import {
  ClientBuilder,
  type ClientResponse,
  type ClientRequest,
} from '@commercetools/ts-client';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
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
          return client.execute({
            ...service
              .withId({ ID: result.id })
              .delete({ queryArgs: { version: result.version } })
              .clientRequest(),
          });
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
    data.map((_data) => {
      let request: ClientRequest;
      if (id) {
        request = service
          .withId({ ID: id })
          .post({ body: _data })
          .clientRequest();
      } else {
        request = service.post({ body: _data }).clientRequest();
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
