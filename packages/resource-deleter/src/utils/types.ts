import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk';
import {
  SuccessResult,
  ClientRequest,
  ClientResponse,
  ClientResult,
} from '@commercetools/ts-client';

/* Logger */
export type LoggerOptions = {
  error: (...args: Array<any>) => void;
  info: (...args: Array<any>) => void;
  warn: (...args: Array<any>) => void;
  debug: (...args: Array<any>) => void;
};

export type HttpHeaders = {
  [key: string]: string;
};

// client
export type MethodType =
  | 'GET'
  | 'POST'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'PUT'
  | 'PATCH'
  | 'TRACE';

// export type ClientRequest = {
//   uri: string;
//   method: MethodType;
//   body?: string | Object;
//   headers?: HttpHeaders;
// };

export type HttpErrorType = {
  name: string;
  message: string;
  code: number;
  status: number;
  statusCode: number;
  originalRequest: ClientRequest;
  body?: Object;
  headers?: HttpHeaders;
};

// export type SuccessResult<T = object> = {
//   body: {
//     count: number;
//     results: Array<T>;
//   };
//   statusCode: number;
//   headers?: HttpHeaders;
// };

// export type ClientResult = SuccessResult | HttpErrorType;
export type ISuccessResponse<T> = {
  limit: number;
  offset: number;
  count: number;
  results: Array<T>;
};

export type ApiConfigOptions = {
  host: string;
  projectKey: string;
  credentials: {
    clientId: string;
    clientSecret: string;
    projectKey?: string;
  };
  scopes?: Array<string>;
  apiUrl?: string;
};

export type CustomClientResult = ClientResult & {
  id: string;
  version?: number;
};

export type DeleterOptions = {
  apiConfig: ApiConfigOptions;
  accessToken?: string;
  predicate?: string;
  logger?: LoggerOptions;
  resource: MethodNames;
  // fetchedResource: CustomClientResult;
};

export type MethodNames =
  | 'carts'
  | 'categories'
  | 'channels'
  | 'customerGroups'
  | 'customers'
  // | "customObjects"
  | 'discountCodes'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'productDiscounts'
  | 'products'
  | 'productTypes'
  | 'reviews'
  | 'shippingMethods'
  | 'states'
  | 'taxCategories'
  | 'types'
  | 'zones';

export type InstanceMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type MethodReturnTypes<T> = {
  [K in InstanceMethods<T>]: T[K] extends (...args: any[]) => infer R
    ? R
    : never;
};
