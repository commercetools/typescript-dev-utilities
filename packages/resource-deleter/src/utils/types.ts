/* eslint-disable */
import { ClientRequest, ClientResult } from '@commercetools/ts-client';

/* Logger */
export type LoggerOptions = {
  error: (...args: Array<unknown>) => void;
  info: (...args: Array<unknown>) => void;
  warn: (...args: Array<unknown>) => void;
  debug: (...args: Array<unknown>) => void;
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

export type HttpErrorType = {
  name: string;
  message: string;
  code: number;
  status: number;
  statusCode: number;
  originalRequest: ClientRequest;
  body?: object;
  headers?: HttpHeaders;
};

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

  key?: string;
  container?: string;
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
  | 'customObjects'
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
