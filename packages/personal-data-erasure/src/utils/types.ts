/* Logger */
export type LoggerOptions = {
  error: (...args: Array<unknown>) => void;
  info: (...args: Array<unknown>) => void;
  warn: (...args: Array<unknown>) => void;
  debug: (...args: Array<unknown>) => void;
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

export type ErasureOptions = {
  apiConfig: ApiConfigOptions;
  accessToken?: string;
  logger: LoggerOptions;
};

export type Customer = {
  id: string;
  version: number;
  customerNumber?: string;
  key?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  title?: string;
  salutation?: string;
  dateOfBirth?: string;
  companyName?: string;
  vatId?: string;
  addresses: Array<object>;
  defaultShippingAddressId?: string;
  shippingAddressIds?: Array<string>;
  billingAddressIds?: Array<string>;
  defaultBillingAddressId?: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastModifiedAt: string;
  lastMessageSequenceNumber?: number;
  externalId?: string;
  customerGroup?: object;
  custom?: object;
  locale?: string;
};

export type Order = {
  id: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  completedAt?: string;
  orderNumber?: string;
  customerId?: string;
  customerEmail?: string;
  anonymousId?: string;
  lineItemsId?: string;
  totalPrice: object;
  taxedPrice?: object;
  shippingAddress?: object;
  billingAddress?: object;
  taxMode: object;
  taxRoundingMode: object;
  taxCalculationMode: object;
  customerGroup?: object;
  country?: string;
  orderState: object;
  state?: object;
  shipmentState?: object;
  paymentState?: object;
  shippingInfo?: object;
  syncInfo: Set<object>;
  returnInfo: Set<object>;
  discountCodes: Array<object>;
  lastMessageSequenceNumber: number;
  cart?: object;
  custom?: object;
  paymentInfo?: object;
  locale?: string;
  inventoryMode: object;
  shippingRateInput?: object;
  origin: object;
  itemShippingAddresses: Array<object>;
};

export type Cart = {
  id: string;
  version: number;
  customerId?: string;
  customerEmail?: string;
  anonymousId?: string;
  lineItemsId?: string;
  totalPrice: object;
  taxedPrice?: object;
  cartState: object;
  shippingAddress?: object;
  billingAddress?: object;
  inventoryMode: object;
  taxMode: object;
  taxRoundingMode: object;
  taxCalculationMode: object;
  customerGroup?: object;
  country?: string;
  shippingInfo?: object;
  discountCodes: Array<object>;
  refusedGifts: Array<object>;
  custom?: object;
  paymentInfo?: object;
  locale?: string;
  deleteDaysAfterLastModification?: number;
  shippingRateInput?: object;
  origin: object;
  createdAt: string;
  lastModifiedAt: string;
  itemShippingAddresses: Array<object>;
};

export type Payment = {
  id: string;
  version: number;
  key?: string;
  customer?: object;
  anonymousId?: string;
  interfaceId?: string;
  amountPlanned: object;
  paymentMethodInfo: object;
  paymentStatus: object;
  transactions: Array<object>;
  interfaceInteractions: Array<object>;
  custom?: object;
  createdAt: string;
  lastModifiedAt: string;
};

export type ShoppingList = {
  id: string;
  key?: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  slug?: string;
  name: string;
  description?: string;
  customer?: object;
  anonymousId?: string;
  lineItems: Array<object>;
  textLineItems: Array<object>;
  custom?: object;
  deleteDaysAfterLastModification?: number;
};

export type Review = {
  id: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  key?: string;
  uniquenessValue?: string;
  locale?: string;
  authorName?: string;
  title?: string;
  text?: string;
  target?: object;
  rating?: number;
  state?: object;
  includedInStatistics: boolean;
  customer?: object;
  custom?: object;
};

export type Message = {
  id: string;
  version: number;
  sequenceNumber: number;
  resource: object;
  resourceVersion: number;
  type: string;
  customer?: Customer;
  createdAt: string;
  lastModifiedAt: string;
};

export type Messages = Array<Message>;

export type AllData = Customer | Order | Cart | Payment | ShoppingList | Review;

// sdk
export type HttpHeaders = {
  [key: string]: string;
};

export type SuccessResult<T = object> = {
  body: {
    count: number;
    results: Array<T>;
  };
  statusCode: number;
  headers?: HttpHeaders;
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

export type ClientRequest = {
  uri: string;
  method: MethodType;
  body?: string | object;
  headers?: HttpHeaders;
};

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

export type ClientResponse = {
  body?: object;
  error?: HttpErrorType;
  statusCode: number;
  headers?: HttpHeaders;
  request?: object;
};

export type ClientResult = SuccessResult | HttpErrorType;
export type ISuccessResponse<T> = {
  limit: number;
  offset: number;
  count: number;
  results: Array<T>;
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
  resource: string;
  fetchedResource: CustomClientResult;
};

export type MethodNames =
  | 'carts'
  | 'categories'
  | 'channels'
  | 'customerGroups'
  | 'customers'
  // | 'customObjects'
  | 'discountCodes'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'productDiscounts'
  | 'shoppingLists'
  | 'products'
  | 'productTypes'
  | 'reviews'
  | 'shippingMethods'
  | 'states'
  | 'taxCategories'
  | 'types'
  | 'zones';
