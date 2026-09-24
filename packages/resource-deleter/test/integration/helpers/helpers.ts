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
        results.map(async (result): Promise<ClientResponse<unknown[]>> => {
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
            const serviceBuilder = service.withId({ ID: result.id });
            let version = result.version;

            // A published product cannot be deleted, so unpublish it first.
            // Unpublishing bumps the version, which the delete then needs.
            // Mirrors how the deleter itself handles this in src/main.ts,
            // including overriding a built request rather than calling
            // .post(), whose update-action union is too complex to type.
            if (result.masterData?.published) {
              await client.execute({
                ...serviceBuilder.get().clientRequest(),
                method: 'POST',
                body: JSON.stringify({
                  version,
                  actions: [{ action: 'unpublish' }],
                }),
              });
              version += 1;
            }

            request = serviceBuilder
              .delete({ queryArgs: { version } })
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
