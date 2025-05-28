export * from './utils/types';
import {
  type Client,
  type ClientResult,
  type ClientRequest,
  type ClientResponse,
  ClientBuilder,
} from '@commercetools/ts-client';

import {
  type ApiRoot,
  type ByProjectKeyRequestBuilder,
  createApiBuilderFromCtpClient,
} from '@commercetools/platform-sdk';

import {
  type ApiConfigOptions,
  type LoggerOptions,
  type DeleterOptions,
  type MethodNames,
  type CustomClientResult,
} from './utils/types';

import silentLogger from './utils/logger';
import { name, version } from '../package.json';

export default class ResourceDeleter {
  private apiConfig: ApiConfigOptions;
  private client: Client;
  private logger: LoggerOptions;
  private predicate?: string;
  private resource: MethodNames;
  private apiRoot: ApiRoot;
  private builder: ByProjectKeyRequestBuilder;

  constructor(options: DeleterOptions) {
    if (!options.apiConfig)
      throw new Error('The constructor must passed an `apiConfig` object');

    if (!options.resource)
      throw new Error('A `resource` string must be passed');

    this.apiConfig = options.apiConfig;
    let client: ClientBuilder = new ClientBuilder();

    if (options.accessToken) {
      client = client.withExistingTokenFlow(`Bearer ${options.accessToken}`, {
        force: true,
      });
    } else {
      client = client.withClientCredentialsFlow({
        ...this.apiConfig,
        httpClient: fetch,
      });
    }

    this.client = client
      .withHttpMiddleware({
        ...this.apiConfig,
        host: options.apiConfig.apiUrl,
        httpClient: fetch,
      })
      .withUserAgentMiddleware({
        libraryName: name,
        libraryVersion: version,
      })
      .withQueueMiddleware({ concurrency: 20 })
      .build();

    this.resource = options.resource;
    this.predicate = options.predicate;
    this.apiRoot = createApiBuilderFromCtpClient(this.client);
    this.builder = this.apiRoot.withProjectKey({
      projectKey: this.apiConfig.projectKey,
    });

    this.logger = {
      ...silentLogger,
      ...options.logger,
    };
  }

  public async run(): Promise<void | Error> {
    this.logger.info(`Starting to delete resource...`);
    const request = this.buildRequestWithPredicate();

    let deletedItems: number = 0;
    return this.client
      .process(
        request,
        async (response: ClientResponse): Promise<unknown> => {
          if (response.statusCode !== 200 && response.statusCode !== 404) {
            return Promise.reject(
              new Error(`Request returned status code ${response.statusCode}`)
            );
          }

          const results = response.body?.results as Array<unknown>;

          if (!results || !results.length) {
            this.logger.info(
              `No requested resource was not found in the project ${this.apiConfig.projectKey}, therefore nothing to delete`
            );

            return Promise.resolve(response);
          }

          this.logger.info(`Deleting ${results.length} resources`);

          return Promise.all(
            // eslint-disable-next-line
            results.map(async (result: any): Promise<ClientResult> => {
              let newVersion: number;

              if (result.masterData?.published) {
                await this.unPublishResource(result);
                newVersion = result.version + 1;
              }

              deletedItems += 1;
              return this.deleteResource({
                ...result,
                version: newVersion || result.version,
              });
            })
          );
        },
        { accumulate: false }
      )
      .then((): void =>
        this.logger.info(
          `A total of ${deletedItems} ${this.resource} have been removed`
        )
      )
      .catch((e: Error): Promise<Error> => {
        this.logger.error(e);
        return Promise.reject(e);
      });
  }

  public getApiRoot(): ApiRoot {
    return this.apiRoot;
  }

  public setResource(resource: MethodNames): void {
    this.resource = resource;
  }

  public setPredicate(predicate: string): void {
    this.predicate = predicate;
  }

  private async unPublishResource(result: {
    id: string;
    version: number;
  }): Promise<ClientResult> {
    return this.client
      .execute({
        ...this.getServiceRequest(result),
        method: 'POST',
        body: JSON.stringify({
          version: result.version,
          actions: [{ action: 'unpublish' }],
        }),
      })
      .then((res: ClientResult): object => res.body)
      .catch((e: Error): object => e);
  }

  private async deleteResource(resource: {
    id: string;
    version?: number;
  }): Promise<ClientResult> {
    const request = this.getServiceRequest(resource, true);
    return this.client
      .execute(request)
      .catch((e: ClientResponse): Promise<ClientResult> => {
        if (e.statusCode === 404) return Promise.resolve() as undefined;
        return Promise.reject(e);
      });
  }

  private createService() {
    if (typeof this.builder[this.resource] === 'function') {
      return this.builder[this.resource]();
    }

    this.logger.error(
      `Method ${String(this.resource)} does not exist on the provided instance`
    );

    throw new Error(
      `Method ${String(this.resource)} does not exist on the provided instance`
    );
  }

  private getServiceRequest(
    resource: CustomClientResult,
    dataErasure?: boolean
  ): ClientRequest {
    const service = this.createService();
    const serviceBuilder = service.withId({ ID: resource.id });

    if (dataErasure) {
      return serviceBuilder
        .delete({ queryArgs: { version: resource.version, dataErasure: true } })
        .clientRequest();
    }

    return serviceBuilder
      .get({ queryArgs: { version: resource.version } })
      .clientRequest();
  }

  private buildRequestWithPredicate(): ClientRequest {
    const service = this.createService();
    const query = { ...(this.predicate && { where: `${this.predicate}` }) };
    return service.get({ queryArgs: { ...query, limit: 500 } }).clientRequest();
  }
}
