// eslint-disable-next-line
require('dotenv').config();
import {
  type Project,
  type CustomerSignInResult,
  type ByProjectKeyRequestBuilder,
} from '@commercetools/platform-sdk';
import PersonalDataErasure, { ErasureOptions } from '../../src/main';
import silentLogger from '../../src/utils/logger';
import { describe, expect, test } from '@jest/globals';
import { ClientResponse } from '@commercetools/ts-client';

describe('::', () => {
  const logger = {
    ...silentLogger,
  };

  const projectKey = process.env.CTP_PROJECT_KEY || '';
  const config = {
    apiUrl: 'https://api.europe-west1.gcp.commercetools.com',
    host: 'https://auth.europe-west1.gcp.commercetools.com',
    projectKey,
    credentials: {
      clientId: process.env.CTP_CLIENT_ID || '',
      clientSecret: process.env.CTP_CLIENT_SECRET || '',
      projectKey,
    },
  };

  let personalDataErasure: PersonalDataErasure;
  beforeAll(async () => {
    personalDataErasure = new PersonalDataErasure({
      logger,
      apiConfig: {
        ...config,
      },
    });
  });

  describe('::constructor', () => {
    test('should throw an error if instance is misconfigured', () => {
      expect(() => new PersonalDataErasure({} as ErasureOptions)).toThrow();
    });

    test('should return a class instance with public methods and properties', () => {
      const instance = new PersonalDataErasure({
        logger,
        apiConfig: {
          ...config,
        },
      });

      expect(typeof instance).toBe('object');
      expect(instance).toHaveProperty('client');
      expect(instance).toHaveProperty('apiRoot');
    });
  });

  describe('::getCustomerData', () => {
    let customerId: string, customer: ClientResponse<CustomerSignInResult>;

    beforeAll(async () => {
      customer = await personalDataErasure
        .getApiRoot()
        .withProjectKey({ projectKey })
        .customers()
        .post({
          body: {
            email: 'example.customer-mail@sample.com',
            password: Date.now().toString(),
          },
        })
        .execute();

      customerId = customer.body.customer.id;
    });

    test('should return customers default personal data', async () => {
      const personalData =
        await personalDataErasure.getCustomerData(customerId);

      expect(personalData).toBeDefined();
      expect(personalData.length).toBeGreaterThan(0);
    });

    test('should include an arbitrary request to default personal data', async () => {
      const personalData = await personalDataErasure.getCustomerData(
        customerId,
        async (builder: ByProjectKeyRequestBuilder) => {
          const request = builder.customers().get().clientRequest();

          return [request];
        },
        { merge: true }
      );

      expect(personalData).toBeDefined();
      expect(personalData.length).toEqual(2);
    });

    test('should create an arbitrary request and do not include it to default request list', async () => {
      const personalData = await personalDataErasure.getCustomerData(
        customerId,
        async (builder: ByProjectKeyRequestBuilder) => {
          const request = builder
            .customers()
            .get({ queryArgs: { where: `id="${customerId}"` } })
            .clientRequest();

          return [request];
        },
        { merge: false }
      );

      expect(personalData).toBeDefined();
      expect(personalData.length).toEqual(1);
    });
  });

  test('should call the `execute` with a generic request', async () => {
    const apiRoot = personalDataErasure.getApiRoot();
    const projectDetailsRequest = apiRoot
      .withProjectKey({
        projectKey,
      })
      .get()
      .clientRequest();

    const response = await personalDataErasure.execute<ClientResponse<Project>>(
      projectDetailsRequest
    );

    expect(typeof response).toEqual('object');
    expect(response.statusCode).toEqual(200);
    expect(response.body.key).toBeDefined();
  });
});
