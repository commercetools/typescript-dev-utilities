import 'dotenv/config';
import PersonalDataErasure, { ErasureOptions } from '../../src/main';
import silentLogger from '../../src/utils/logger';
import { describe, expect, test } from '@jest/globals';

describe('PersonalDataErasure', () => {
  const logger = {
    ...silentLogger,
  };

  const config = {
    host: 'https://sample-host.com',
    apiUrl: 'https://sample-api-url.com',
    projectKey: 'sample-project-key',
    credentials: {
      clientId: 'sample-clientId',
      clientSecret: 'sample-clientSecret',
    },
  };

  let personalDataErasure;
  beforeAll(async () => {
    personalDataErasure = new PersonalDataErasure({
      logger,
      apiConfig: {
        ...config,
      },
    });
  });

  describe('::constructor', () => {
    test('should be a function', () => {
      expect(typeof personalDataErasure).toBe('object');
      expect(typeof PersonalDataErasure).toBe('function');
    });

    test('should set default properties', () => {
      expect(personalDataErasure.logger).toEqual(logger);
      expect(personalDataErasure.apiConfig).toEqual(config);
    });

    test('should configure with instance with an existing token', () => {
      const _personalDataErasure = new PersonalDataErasure({
        logger,
        accessToken: 'access-token',
        apiConfig: {
          ...config,
        },
      });

      expect(_personalDataErasure).toHaveProperty('logger');
      expect(_personalDataErasure).toHaveProperty('client');
      expect(_personalDataErasure).toHaveProperty('apiRoot');
    });

    test('should throw error if no `apiConfig` in `options` parameter', () => {
      expect(
        () =>
          new PersonalDataErasure({ foo: 'bar' } as unknown as ErasureOptions)
      ).toThrowErrorMatchingSnapshot();
    });
  });

  describe('::getCustomerData', () => {
    let payload;
    describe('with status code 200', () => {
      beforeEach(() => {
        payload = {
          statusCode: 200,
          body: {
            results: [
              { version: 1, id: 'id1' },
              { version: 1, id: 'id2' },
            ],
          },
        };

        personalDataErasure.client = {
          process: jest.fn(() => Promise.resolve([payload])),
          execute: jest.fn(() => Promise.resolve(payload)),
        };
      });

      test('should fetch data', async () => {
        const data = await personalDataErasure.getCustomerData('customerId');
        expect(data).toMatchSnapshot();
      });
    });

    describe('with status code 500', () => {
      beforeEach(() => {
        payload = {
          statusCode: 500,
          body: {
            count: 0,
            results: [],
          },
        };
        personalDataErasure.client.process = jest.fn(
          async (_request, callback) => {
            await callback(payload);
          }
        );
      });

      test('should throw internal server error', () =>
        expect(
          personalDataErasure.getCustomerData('customerId')
        ).rejects.toThrowErrorMatchingSnapshot());
    });

    describe('with status code 404', () => {
      beforeEach(() => {
        payload = {
          statusCode: 404,
          body: {
            results: [],
          },
        };

        personalDataErasure.client = {
          process: jest.fn(() => Promise.resolve([payload])),
          execute: jest.fn(() => Promise.resolve(payload)),
        };
      });

      test('should fetch empty data', async () => {
        const data = await personalDataErasure.getCustomerData('customerId');
        expect(data).toHaveLength(0);
      });
    });

    test('should retrieve the configured client', () => {
      const client = personalDataErasure.getClient();
      expect(client).toHaveProperty('execute');
      expect(client).toHaveProperty('process');
    });

    test('should reject on error when `execute` is called', async () => {
      personalDataErasure.client = {
        execute: jest.fn(() => {
          throw new Error();
        }),
      };

      expect(async () => {
        await personalDataErasure.execute({
          method: 'GET',
          uri: 'get-resource.com',
        });
      }).rejects.toThrowError();
    });

    test('should retrieve the configured apiRoot', () => {
      const apiRoot = personalDataErasure.getApiRoot();
      expect(apiRoot).toHaveProperty('baseUri');
      expect(apiRoot).toHaveProperty('executeRequest');
    });

    test('should throw error if no customerID is passed', () => {
      expect(
        async () => await personalDataErasure.getCustomerData()
      ).rejects.toThrow();
    });

    test('should throw if `getResourceList` is not a function', () => {
      const getResourceList = 'not-a-function';
      expect(
        async () =>
          await personalDataErasure.getCustomerData(
            'customerId',
            getResourceList
          )
      ).rejects.toThrowError('the second argument must be a function');
    });
  });

  describe('::deleteAll', () => {
    describe('with status code 200', () => {
      let payload;
      beforeEach(() => {
        payload = {
          statusCode: 200,
          body: {
            results: [
              { version: 1, id: 'id1' },
              { version: 1, id: 'id2' },
            ],
          },
        };

        personalDataErasure.client = {
          process: jest.fn(() => Promise.resolve([payload])),
          execute: jest.fn(() => Promise.resolve(payload)),
        };
      });
      test('should delete data', async () => {
        await personalDataErasure.deleteAll('customerId');
      });
    });

    describe('with status code 404', () => {
      let payload;
      beforeEach(() => {
        payload = {
          statusCode: 404,
          body: {
            results: [],
          },
        };

        personalDataErasure.client = {
          process: jest.fn(() => Promise.resolve([payload])),
          execute: jest.fn(() => Promise.resolve(payload)),
        };
      });

      test('should delete data', async () => {
        await personalDataErasure.deleteAll('customerId');
      });
    });

    describe('with status code 500', () => {
      beforeEach(() => {
        const payload = {
          statusCode: 500,
          body: {
            results: [],
          },
        };
        personalDataErasure.client.execute = jest.fn(() =>
          Promise.resolve(payload)
        );
      });

      test('should throw internal server error', () =>
        expect(
          personalDataErasure.deleteAll('customerId')
        ).rejects.toThrowErrorMatchingSnapshot());
    });

    test('should throw error if no customerID is passed', () => {
      return expect(
        personalDataErasure.deleteAll()
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('::buildReference', () => {
    test('should build reference', () => {
      expect(
        PersonalDataErasure.buildReference(['id1', 'id2', 'id3'])
      ).toMatchSnapshot();
    });
  });
});
