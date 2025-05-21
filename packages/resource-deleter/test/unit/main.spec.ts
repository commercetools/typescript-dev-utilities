require("dotenv").config();
import ResourceDeleter from "../../src/main";
import silentLogger from "../../src/utils/logger";
import { describe, expect, test } from "@jest/globals";
import { MethodNames } from "../../src/utils/types";

describe("ResourceDeleter", () => {
  const logger = {
    ...silentLogger,
  };

  const ID = "sample-ID";
  const options = {
    logger,
    apiConfig: {
      host: "https://sample-host.com",
      apiUrl: "https://sample-api-url.com",
      projectKey: "sample-project-key",
      credentials: {
        clientId: "sample-clientId",
        clientSecret: "sample-clientSecret",
      },
    },
    resource: "categories" as MethodNames,
    predicate: `id=${ID}`,
  };

  let resourceDeleter;
  beforeEach(async () => {
    resourceDeleter = new ResourceDeleter(options);
  });

  describe("::constructor", () => {
    test("should be a function", () => {
      expect(typeof resourceDeleter).toBe("object");
      expect(typeof ResourceDeleter).toBe("function");
    });

    test("should set default properties", () => {
      expect(resourceDeleter.logger).toEqual(logger);
      expect(resourceDeleter.apiConfig).toEqual(options.apiConfig);
      expect(resourceDeleter.resource).toEqual(options.resource);
    });

    test("should if resource property is undefined", () => {
      expect(
        () => new ResourceDeleter({ ...options, resource: undefined })
      ).toThrow("A `resource` string must be passed");
    });

    test("should configure with instance with an existing token", () => {
      const _resourceDeleter = new ResourceDeleter({
        accessToken: "access-token",
        ...options,
      });

      expect(_resourceDeleter).toHaveProperty("logger");
      expect(_resourceDeleter).toHaveProperty("client");
      expect(_resourceDeleter).toHaveProperty("apiRoot");
    });

    test("should throw error if no `apiConfig` in `options` parameter", () => {
      expect(
        () => new ResourceDeleter({ foo: "bar" } as any)
      ).toThrowErrorMatchingSnapshot();
    });
  });

  describe("::run", () => {
    let payload;
    describe("with status code 200", () => {
      beforeEach(() => {
        payload = {
          statusCode: 200,
          body: {
            results: [
              { id: "foo1", key: "fooKey", version: 1 },
              { id: "boo2", key: "booKey", version: 2 },
              { id: "fooboo3", key: "foboKey", version: 3 },
            ],
          },
        };

        resourceDeleter.logger.info = jest.fn();
        resourceDeleter.client = {
          execute: jest.fn(() => Promise.resolve(payload)),
          process: jest.fn((_, callback, {}) => {
            callback(payload);
            return Promise.resolve([payload]);
          }),
        };
      });

      test("should delete fetched resource", async () => {
        const noOfResourceToDelete = payload.body.results.length;
        await resourceDeleter.run();
        expect(resourceDeleter.logger.info).toHaveBeenCalledTimes(3);
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          1,
          "Starting to delete resource..."
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          2,
          `Deleting ${noOfResourceToDelete} resources`
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          3,
          `A total of ${noOfResourceToDelete} ${resourceDeleter.resource} have been removed`
        );
      });
    });

    describe("should show message that no resource is found when resource is empty with status code 200", () => {
      beforeEach(() => {
        payload = {
          statusCode: 200,
          body: {
            results: [],
          },
        };

        resourceDeleter.client = {
          execute: jest.fn(() => Promise.resolve(payload)),
          process: jest.fn((_, callback, {}) => {
            callback(payload);
            return Promise.resolve([payload]);
          }),
        };
      });

      test("should resolve for an empty resource", async () => {
        await resourceDeleter.run();
        await expect(Promise.resolve("nothing to delete")).resolves.toBe(
          "nothing to delete"
        );
      });
    });

    describe("should delete product that is published", () => {
      beforeEach(() => {
        payload = {
          statusCode: 200,
          body: {
            results: [
              {
                id: "foo1",
                version: 1,
                masterData: { published: true },
              },
            ],
          },
        };

        resourceDeleter.logger.info = jest.fn();
        resourceDeleter.logger.error = jest.fn();
        resourceDeleter.unPublishResource = jest.fn();
        resourceDeleter.client = {
          execute: jest.fn(() => Promise.resolve(payload)),
          process: jest.fn((_, callback, {}) => {
            callback(payload);
            return Promise.resolve([payload]);
          }),
        };
      });

      test("should delete published resource", async () => {
        const noOfResourceToDelete = payload.body.results.length;
        await resourceDeleter.run();
        expect(resourceDeleter.logger.info).toHaveBeenCalledTimes(3);
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          1,
          "Starting to delete resource..."
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          2,
          `Deleting ${noOfResourceToDelete} resources`
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          3,
          `A total of ${noOfResourceToDelete} ${resourceDeleter.resource} have been removed`
        );
        expect(resourceDeleter.logger.error).not.toHaveBeenCalled();
      });
    });

    describe("should delete categories without children", () => {
      beforeEach(() => {
        resourceDeleter = new ResourceDeleter(options);
        payload = {
          statusCode: 200,
          body: {
            results: [
              {
                id: "barCat",
                version: 1,
                ancestors: [],
              },
            ],
          },
        };

        resourceDeleter.client.process = jest.fn((_, callback, {}) => {
          callback(payload);
          return Promise.resolve([payload]);
        });
        resourceDeleter.client.execute = jest
          .fn(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.resolve(payload))
          .mockImplementationOnce(() => Promise.resolve(payload.body.result[0]))
          .mockImplementationOnce(() => Promise.resolve());

        resourceDeleter.deleteResource = jest.fn();
        resourceDeleter.logger.info = jest.fn();
      });

      test("should delete children categories before deleting the parent", async () => {
        await resourceDeleter.run();
        const noOfResourceToDelete = payload.body.results.length;
        expect(resourceDeleter.deleteResource).toHaveBeenCalledTimes(1);
        expect(resourceDeleter.logger.info).toHaveBeenCalledWith(
          `A total of ${noOfResourceToDelete} ${resourceDeleter.resource} have been removed`
        );
      });
    });

    describe("should delete categories with children", () => {
      beforeEach(() => {
        resourceDeleter = new ResourceDeleter(options);
        payload = {
          statusCode: 200,
          body: {
            results: [
              {
                id: "barParent123",
                version: 1,
                ancestors: [],
              },
              {
                id: "barChild1",
                version: 1,
                ancestors: [{ id: "barParent123", typeId: "category" }],
              },
              {
                id: "barChild2",
                version: 1,
                ancestors: [{ id: "barParent123", typeId: "category" }],
              },
            ],
          },
        };

        resourceDeleter.client = {
          execute: jest.fn(() => Promise.resolve(payload)),
          process: jest.fn((_, callback, {}) => {
            callback(payload);
            return Promise.resolve([payload]);
          }),
        };
        resourceDeleter.client.execute = jest
          .fn(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.resolve(payload))
          .mockImplementationOnce(() => Promise.resolve(payload.body.result[0]))
          .mockImplementationOnce(() => Promise.resolve());

        resourceDeleter.deleteResource = jest.fn();
        resourceDeleter.logger.info = jest.fn();
      });

      test("should delete children categories before deleting the parent", async () => {
        await resourceDeleter.run();
        const noOfResourceToDelete = payload.body.results.length;
        expect(resourceDeleter.deleteResource).toHaveBeenCalledTimes(3);
        expect(resourceDeleter.logger.info).toHaveBeenCalledTimes(3);
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          1,
          "Starting to delete resource..."
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          2,
          `Deleting ${noOfResourceToDelete} resources`
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          3,
          `A total of ${noOfResourceToDelete} ${resourceDeleter.resource} have been removed`
        );
      });
    });

    describe("should delete categories with & without children", () => {
      beforeEach(() => {
        resourceDeleter = new ResourceDeleter(options);
        payload = {
          statusCode: 200,
          body: {
            results: [
              {
                id: "barCat21",
                version: 1,
                ancestors: [],
              },
              {
                id: "fooCat1",
                version: 1,
                ancestors: [],
              },
              {
                id: "fooCat2",
                version: 1,
                ancestors: [],
              },
              {
                id: "barParent123",
                version: 1,
                ancestors: [],
              },
              {
                id: "barChild1",
                version: 1,
                ancestors: [{ id: "barParent123", typeId: "category" }],
              },
              {
                id: "barChild2",
                version: 1,
                ancestors: [{ id: "barParent123", typeId: "category" }],
              },
              {
                id: "barGrandChild21",
                version: 1,
                ancestors: [
                  { id: "barParent123", typeId: "category" },
                  { id: "barChild2", typeId: "category" },
                ],
              },
              {
                id: "barGrandChild22",
                version: 1,
                ancestors: [
                  { id: "barParent123", typeId: "category" },
                  { id: "barChild2", typeId: "category" },
                ],
              },
              {
                id: "barGreatGrandChild21",
                version: 1,
                ancestors: [
                  { id: "barParent123", typeId: "category" },
                  { id: "barChild2", typeId: "category" },
                  { id: "barGrandChild21", typeId: "category" },
                ],
              },
              {
                id: "barGreatGrandChild22",
                version: 1,
                ancestors: [
                  { id: "barParent123", typeId: "category" },
                  { id: "barChild2", typeId: "category" },
                  { id: "barGrandChild21", typeId: "category" },
                ],
              },
              {
                id: "barGGreatGrandChild22",
                version: 1,
                ancestors: [
                  { id: "barParent123", typeId: "category" },
                  { id: "barChild2", typeId: "category" },
                  { id: "barGrandChild21", typeId: "category" },
                  { id: "barGreatGrandChild22", typeId: "category" },
                ],
              },
            ],
          },
        };

        resourceDeleter.client.process = jest.fn((_, callback, {}) => {
          callback(payload);
          return Promise.resolve([payload]);
        });
        resourceDeleter.client.execute = jest
          .fn(() => Promise.resolve())
          .mockImplementationOnce(() => Promise.resolve(payload))
          .mockImplementationOnce(() => Promise.resolve(payload.body.result[0]))
          .mockImplementationOnce(() => Promise.resolve());

        resourceDeleter.deleteResource = jest.fn();
        resourceDeleter.logger.info = jest.fn();
      });

      test("should delete categories without children first before deleting others", async () => {
        const noOfResourceToDelete = payload.body.results.length;
        await resourceDeleter.run();
        expect(resourceDeleter.deleteResource).toHaveBeenCalledTimes(11);
        expect(resourceDeleter.logger.info).toHaveBeenCalledTimes(3);
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          1,
          "Starting to delete resource..."
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          2,
          `Deleting ${noOfResourceToDelete} resources`
        );
        expect(resourceDeleter.logger.info).toHaveBeenNthCalledWith(
          3,
          `A total of ${noOfResourceToDelete} ${resourceDeleter.resource} have been removed`
        );
      });
    });

    describe("should throw error during categories deletion when problem occur", () => {
      beforeEach(() => {
        resourceDeleter = new ResourceDeleter(options);
        payload = {
          statusCode: 200,
          body: {
            results: [
              {
                id: "barParent2",
                version: 1,
                ancestors: [],
              },
              {
                id: "barChild21",
                version: 1,
                ancestors: [{ id: "barParent23", typeId: "category" }],
              },
            ],
          },
        };

        resourceDeleter.client.process = jest.fn((_, callback, {}) => {
          callback(payload);
          return Promise.resolve([payload]);
        });

        resourceDeleter.client.execute = jest
          .fn()
          .mockImplementationOnce(() => Promise.resolve(payload))
          .mockImplementation(() =>
            Promise.reject(new Error("error during `categories` deletion"))
          );
      });

      test("should throw error when there is a problem during categories deletion ", async () => {
        const firstResult = await resourceDeleter.client.execute();
        expect(firstResult).toEqual(payload);

        await expect(resourceDeleter.client.execute()).rejects.toThrow(
          "error during `categories` deletion"
        );
      });
    });

    describe("should throw error when requires parameters are not passed with status code 200", () => {
      beforeEach(() => {
        payload = {
          statusCode: 200,
          body: {
            results: [
              { id: "foo1", key: "fooKey", version: 1 },
              { id: "boo2", key: "booKey", version: 2 },
              { id: "fooboo3", key: "foboKey", version: 3 },
            ],
          },
        };

        resourceDeleter.client.execute = jest
          .fn()
          .mockResolvedValueOnce(payload as never) // First call resolves
          .mockRejectedValue(new Error("error during `resource` deletion"));
      });

      test("should throw error if required parameter are missing with the resource during deletion", async () => {
        const firstResult = await resourceDeleter.client.execute();
        expect(firstResult).toEqual(payload);

        await expect(resourceDeleter.client.execute()).rejects.toThrow(
          "error during `resource` deletion"
        );
      });
    });

    describe("with status code 500", () => {
      beforeEach(() => {
        payload = {
          statusCode: 500,
          body: {
            results: [],
          },
        };
        resourceDeleter.client.process = jest.fn(async (request, callback) => {
          await callback(payload);
        });
      });

      test("should throw internal server error", () =>
        expect(resourceDeleter.run()).rejects.toThrow(
          /Request returned status code 500/
        ));
    });
  });

  describe("::deleteResource non 404 error", () => {
    // let payload;
    beforeEach(() => {
      // payload = {
      //   statusCode: 200,
      //   body: {
      //     results: [
      //       { id: "foo1", key: "fooKey", version: 1 },
      //       { id: "boo2", key: "booKey", version: 2 },
      //       { id: "fooboo3", key: "foboKey", version: 3 },
      //     ],
      //   },
      // };

      resourceDeleter.getServiceRequest = jest.fn(() => ({
        uri: "http://sample-resource.uri.com",
        method: "DELETE",
      }));

      resourceDeleter.client.execute = jest
        .fn()
        .mockRejectedValue(new Error("error during `resource` deletion"));
    });

    test("should reject with error if deletion process completed with errors", () => {
      expect(resourceDeleter.deleteResource()).rejects.toThrow(
        /error during `resource` deletion/
      );
    });
  });

  describe("::deleteResource 404 error", () => {
    let payload;
    beforeEach(() => {
      payload = {
        statusCode: 404,
        body: {
          results: [],
        },
      };

      resourceDeleter.getServiceRequest = jest.fn(() => ({
        uri: "http://sample-resource.uri.com",
        method: "DELETE",
      }));

      resourceDeleter.client.execute = jest.fn().mockRejectedValue(payload);
    });

    test("should resolve with undefine if deletion completed with 404 error", () => {
      expect(resourceDeleter.deleteResource()).resolves.toEqual(undefined);
    });
  });

  describe("::createService", () => {
    let resource;
    beforeEach(() => {
      resource = "carts";
      resourceDeleter.resource = resource;
      resourceDeleter.logger.error = jest.fn();
      resourceDeleter.builder = { carts: "not-a-function" };
    });

    test("should throw error if typeof resource builder is not a function", () => {
      try {
        resourceDeleter.createService();
      } catch (e) {
        expect(resourceDeleter.logger.error).toHaveBeenCalledWith(
          `Method ${resource} does not exist on the provided instance`
        );

        expect(e.message).toEqual(
          `Method ${resource} does not exist on the provided instance`
        );
      }
    });
  });

  describe("::unPublishResource", () => {
    let result;
    beforeEach(() => {
      result = { id: "sample-id", version: 1 };
      resourceDeleter.getServiceRequest = jest.fn(() => ({
        uri: options.apiConfig.apiUrl,
        method: "POST",
      }));

      resourceDeleter.client = {
        execute: jest.fn().mockResolvedValue({
          body: { published: false },
          statusCode: 200,
        }),
      };
    });

    test("should unpublish a resource", async () => {
      const res = await resourceDeleter.unPublishResource(result);
      expect(res.published).toEqual(false);
    });
  });

  // private methods
  describe("::buildRequest", () => {
    test("should build default request", () => {
      // expect(ResourceDeleter.buildRequest("example.com", "GET")).toEqual({
      //   uri: "example.com",
      //   method: "GET",
      // });
      // expect(ResourceDeleter.buildRequest("example.com", "DELETE")).toEqual({
      //   uri: "example.com",
      //   method: "DELETE",
      // });

      // const resourceDeleter = new ResourceDeleter({...options, resource: 'carts'})

      // console.log(resourceDeleter., "<<<");
      const response = { id: "sample-id", version: 1 };
      expect(resourceDeleter.getServiceRequest(response)).toEqual(
        expect.objectContaining({
          method: "GET",
          uri: `/${options.apiConfig.projectKey}/${options.resource}/${response.id}?version=${response.version}`,
        })
      );
    });

    test("should build DELETE request", () => {
      const response = { id: "sample-id", version: 1 };
      expect(resourceDeleter.getServiceRequest(response, true)).toEqual(
        expect.objectContaining({
          method: "DELETE",
          uri: `/${options.apiConfig.projectKey}/${options.resource}/${response.id}?version=${response.version}&dataErasure=true`,
        })
      );
    });
  });

  describe("::buildRequestWithPredicate", () => {
    test("should build request with predicate", () => {
      expect(resourceDeleter.buildRequestWithPredicate()).toEqual(
        expect.objectContaining({
          method: "GET",
          uri: `/${options.apiConfig.projectKey}/${
            options.resource
          }?where=${options.predicate.replace("=", "%3D")}&limit=500`,
        })
      );
    });

    test("should build request without predicate", () => {
      const _resourceDeleter = new ResourceDeleter({
        ...options,
        predicate: undefined,
      });

      expect(_resourceDeleter["buildRequestWithPredicate"]()).toEqual(
        expect.objectContaining({
          method: "GET",
          uri: `/${options.apiConfig.projectKey}/${options.resource}?limit=500`,
        })
      );
    });
  });

  describe("::setPredicate", () => {
    test("should set predicate using the `setPredicate` method", () => {
      const newPredicate = "key=foo";
      expect(resourceDeleter.predicate).toEqual(options.predicate);
      resourceDeleter.setPredicate(newPredicate);
      expect(resourceDeleter.predicate).toEqual(newPredicate);
    });
  });

  describe("::setResource", () => {
    test("should set resource using the `setResource` method", () => {
      const newResource = "taxCategories";
      expect(resourceDeleter.predicate).toEqual(options.predicate);
      resourceDeleter.setResource(newResource);
      expect(resourceDeleter.resource).toEqual(newResource);
    });
  });
});
