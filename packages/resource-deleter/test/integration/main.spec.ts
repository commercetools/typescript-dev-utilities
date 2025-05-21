require("dotenv").config();
import {
  type Store,
  type Project,
  type Customer,
  type CustomerSignInResult,
  type ByProjectKeyRequestBuilder,
  type ApiRoot,
} from "@commercetools/platform-sdk";
import { MethodNames } from "../../src/utils/types";

import ResoureDeleter from "../../src/main";
import silentLogger from "../../src/utils/logger";
import { describe, expect, test } from "@jest/globals";
import { ClientResponse } from "@commercetools/ts-client";

describe("::", () => {
  const logger = {
    ...silentLogger,
  };

  const projectKey = process.env.CTP_PROJECT_KEY || "";
  const options = {
    logger,
    apiConfig: {
      projectKey,
      host: process.env.CTP_AUTH_URL || "",
      apiUrl: process.env.CTP_API_URL || "",
      credentials: {
        clientId: process.env.CTP_CLIENT_ID || "",
        clientSecret: process.env.CTP_CLIENT_SECRET || "",
      },
    },
    resource: "customers" as MethodNames,
    // predicate: `id=${ID}`,
  };

  let api: ApiRoot;
  let resourceDeleter: ResoureDeleter;
  beforeAll(async () => {
    resourceDeleter = new ResoureDeleter(options);
    api = resourceDeleter.getApiRoot();
  });

  describe("::constructor", () => {
    test("should throw an error is instance is misconfigured", () => {
      expect(() => new ResoureDeleter({} as any)).toThrow();
    });

    test("should return a class instance with public methods and properties", () => {
      const instance = new ResoureDeleter(options);

      expect(typeof instance).toBe("object");
      expect(instance).toHaveProperty("client");
      expect(instance).toHaveProperty("apiRoot");
      expect(instance).toHaveProperty("builder");
      expect(instance).toHaveProperty("predicate");
    });
  });

  describe("::run", () => {
    const carts = [
      { currency: "EUR" },
      { currency: "USD" },
      { currency: "CAD" },
    ];
    const getCarts = async () => {
      return api.withProjectKey({ projectKey }).carts().get().execute();
    };

    afterAll(async () => {
      const res = (await getCarts()).body.results;
      for await (const { id, version } of res) {
        await api
          .withProjectKey({ projectKey })
          .carts()
          .withId({ ID: id })
          .delete({ queryArgs: { version } })
          .execute();
      }
    });

    beforeAll(async () => {
      for await (const { currency } of carts) {
        const res = await api
          .withProjectKey({ projectKey })
          .carts()
          .post({
            body: {
              currency,
            },
          })
          .execute();
      }
    });

    test("should get all carts", async () => {
      const res = await getCarts();
      const result = res.body.results;
      expect(result.length).toBeGreaterThan(0);
    });

    test("should delete all carts", async () => {
      resourceDeleter.setResource("carts");
      await resourceDeleter.run();

      const res = await getCarts();
      expect(res.body.results.length).toEqual(0);
    });
  });
});
