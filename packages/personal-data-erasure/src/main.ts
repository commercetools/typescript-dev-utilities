export * from "./utils/types";
import {
  ClientBuilder,
  type Client,
  type ClientRequest,
  type ClientResponse,
  type ClientResult,
} from "@commercetools/ts-client";

import {
  createApiBuilderFromCtpClient,
  type ApiRoot,
  type ByProjectKeyRequestBuilder,
} from "@commercetools/platform-sdk";

import {
  type ApiConfigOptions,
  type LoggerOptions,
  type ErasureOptions,
  type AllData,
  type Messages,
  type ISuccessResponse,
} from "./utils/types";

import flatten from "lodash.flatten";
import silentLogger from "./utils/logger";
import { name, version } from "../package.json";

export default class PersonalDataErasure {
  private client: Client;
  private apiRoot: ApiRoot;
  private apiConfig: ApiConfigOptions;
  private logger: LoggerOptions;

  constructor(options: ErasureOptions) {
    if (!options.apiConfig) {
      throw new Error(
        "The class must be instantiated with an `apiConfig` option"
      );
    }

    let _client: ClientBuilder = new ClientBuilder();
    this.apiConfig = options.apiConfig;
    if (options.accessToken) {
      _client = _client.withExistingTokenFlow(`Bearer ${options.accessToken}`, {
        force: true,
      });
    } else {
      _client = _client.withClientCredentialsFlow({
        ...this.apiConfig,
        httpClient: fetch,
      });
    }

    this.client = _client
      .withHttpMiddleware({
        ...this.apiConfig,
        host: options.apiConfig.apiUrl,
        httpClient: fetch,
      })
      .withUserAgentMiddleware({
        libraryName: name,
        libraryVersion: version,
      })
      .build();

    this.apiRoot = createApiBuilderFromCtpClient(this.client);
    this.logger = {
      ...silentLogger,
      ...options.logger,
    };
  }

  public async getCustomerData(
    customerId: string,
    getResourceList?: (
      builder: ByProjectKeyRequestBuilder
    ) => Promise<Array<ClientRequest>>,
    options: { merge: boolean } = { merge: false }
  ): Promise<Array<AllData>> {
    if (!customerId) throw Error("missing `customerId` argument");
    if (getResourceList && typeof getResourceList !== "function")
      throw Error("the second argument must be a function");

    this.logger.info("Starting to fetch data");

    const requestBuilder = this.apiRoot.withProjectKey({
      projectKey: this.apiConfig.projectKey,
    });

    const customersRequest = requestBuilder
      .customers()
      .get({ queryArgs: { where: `id="${customerId}"` } })
      .clientRequest();

    const ordersRequest = requestBuilder
      .orders()
      .get({ queryArgs: { where: `id="${customerId}"` } })
      .clientRequest();

    const cartsRequest = requestBuilder
      .carts()
      .get({ queryArgs: { where: `id="${customerId}"` } })
      .clientRequest();

    const paymentsRequest = requestBuilder
      .payments()
      .get({ queryArgs: { where: `id="${customerId}"` } })
      .clientRequest();

    const shoppingListRequest = requestBuilder
      .shoppingLists()
      .get({ queryArgs: { where: `id="${customerId}"` } })
      .clientRequest();

    const reviewsRequest = requestBuilder
      .reviews()
      .get({ queryArgs: { where: `id="${customerId}"` } })
      .clientRequest();

    let urisOfResources: Array<ClientRequest>;
    if (options.merge) {
      urisOfResources = [
        customersRequest,
        ordersRequest,
        cartsRequest,
        paymentsRequest,
        shoppingListRequest,
        reviewsRequest,
        ...(await getResourceList?.(requestBuilder)),
      ];
    } else {
      urisOfResources = (await getResourceList?.(requestBuilder)) ?? [
        customersRequest,
        ordersRequest,
        cartsRequest,
        paymentsRequest,
        shoppingListRequest,
        reviewsRequest,
      ];
    }

    return Promise.all(
      urisOfResources.map(
        (
          request: ClientRequest
        ): Promise<
          Array<ClientResponse<ISuccessResponse<AllData>>> | Array<void>
        > => {
          return this.client.process(
            request,
            (response: ClientResult): Promise<ClientResult> => {
              if (response.statusCode !== 200 && response.statusCode !== 404)
                return Promise.reject(
                  Error(`Request returned status code ${response.statusCode}`)
                );

              return Promise.resolve(response);
            },
            { accumulate: true }
          );
        }
      )
    ).then(
      async (
        response: Array<Array<ClientResponse<ISuccessResponse<AllData>>>>
      ): Promise<Array<AllData>> => {
        const flattenedResponse = flatten(response);

        let result = flatten(
          flattenedResponse.map(
            (
              response: ClientResponse<ISuccessResponse<AllData>>
            ): Array<AllData> => response.body.results
          )
        );

        const ids: string[] = result.map(
          (result: AllData): string => result.id
        );

        if (ids.length > 0) {
          const reference = PersonalDataErasure.buildReference(ids);
          const request = requestBuilder
            .messages()
            .get({ queryArgs: { where: reference } })
            .clientRequest();

          const messages = await this.getAllMessages(request);

          result = [...messages, ...result] as Array<AllData>;
        }

        this.logger.info("Export operation completed successfully");
        return Promise.resolve(result);
      }
    );
  }

  public async deleteAll(
    customerId: string,
    getResourceList?: (
      bulder: ByProjectKeyRequestBuilder
    ) => Promise<Array<ClientRequest>>
  ): Promise<void> {
    if (!customerId) throw Error("missing `customerId` argument");

    this.logger.info("Starting deletion");

    const requestBuilder = this.apiRoot.withProjectKey({
      projectKey: this.apiConfig.projectKey,
    });

    const customersResource = {
      builder: requestBuilder.customers(),
      request: requestBuilder
        .customers()
        .get({ queryArgs: { where: `id = "${customerId}"` } })
        .clientRequest(),
    };

    const ordersResource = {
      builder: requestBuilder.orders(),
      request: requestBuilder
        .orders()
        .get({ queryArgs: { where: `id = "${customerId}"` } })
        .clientRequest(),
    };

    const paymentsResource = {
      builder: requestBuilder.payments(),
      request: requestBuilder
        .payments()
        .get({ queryArgs: { where: `id = "${customerId}"` } })
        .clientRequest(),
    };

    const shoppingListsResource = {
      builder: requestBuilder.shoppingLists(),
      request: requestBuilder
        .shoppingLists()
        .get({ queryArgs: { where: `id = "${customerId}"` } })
        .clientRequest(),
    };

    const reviewsResource = {
      builder: requestBuilder.reviews(),
      request: requestBuilder
        .reviews()
        .get({ queryArgs: { where: `id = "${customerId}"` } })
        .clientRequest(),
    };

    const cartsResource = {
      builder: requestBuilder.carts(),
      request: requestBuilder
        .carts()
        .get({ queryArgs: { where: `id = "${customerId}"` } })
        .clientRequest(),
    };

    const resourceToDelete = [
      reviewsResource,
      shoppingListsResource,
      ordersResource,
      cartsResource,
      paymentsResource,
      customersResource,
      ...((await getResourceList?.(requestBuilder)) || []),
    ];

    for (let i = 0; i < resourceToDelete.length; i++) {
      const resource = resourceToDelete[i];
      let continueProcessing = true;

      while (continueProcessing) {
        const response = await this.client.execute(resource.request);
        if (response.statusCode !== 200 && response.statusCode !== 404)
          return Promise.reject(
            Error(`Request returned status code ${response.statusCode}`)
          );

        if (response.body && response.body.results.length < 20)
          continueProcessing = false;

        if (response.statusCode == 200)
          await this.deleteOne(
            response,
            resource.builder as typeof resource.builder
          );
      }
    }
  }

  public async execute<T>(request: ClientRequest): Promise<T> {
    try {
      const response = await this.client.execute(request);
      return Promise.resolve(response) as T;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public getClient(): Client {
    return this.client;
  }

  public getApiRoot(): ApiRoot {
    return this.apiRoot;
  }

  private async deleteOne(
    response: ClientResult,
    builder: ByProjectKeyRequestBuilder
  ): Promise<void> {
    const result = response.body ? response.body.results : [];

    if (result.length > 0) {
      await Promise.all(
        result.map((result: AllData): Promise<ClientResult> => {
          const deleteRequest = PersonalDataErasure.buildDeleteRequest(
            result,
            builder
          );

          return this.client.execute(deleteRequest);
        })
      );
    }
  }

  private static buildDeleteRequest(result: AllData, builder): ClientRequest {
    return builder
      .withId({ ID: result.id })
      .delete({ queryArgs: { version: 1, dataErasure: true } })
      .clientRequest();
  }

  private async getAllMessages(request: ClientRequest): Promise<Messages> {
    const messages = await this.client.process(
      request,
      (response: ClientResult): Promise<ClientResult> => {
        if (response.statusCode !== 200 && response.statusCode !== 404)
          return Promise.reject(
            Error(`Request returned status code ${response.statusCode}`)
          );

        return Promise.resolve(response);
      },
      { accumulate: true }
    );

    return flatten(
      messages.map((response): Messages | undefined =>
        response.body ? response.body?.results : undefined
      )
    );
  }

  static buildReference(references: Array<string>): string {
    return `resource(id in ("${references
      .map((id: string): string => id)
      .join('", "')}"))`;
  }
}
