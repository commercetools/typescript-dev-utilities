export const customer = [
  {
    email: 'foo@bar.de',
    password: 'foobar',
    key: 'myKey',
  },
];

export const shoppingList = [
  {
    name: {
      de: 'deutscherListenName',
      en: 'englishListName',
    },
  },
];

export const review = [
  {
    text: 'Review text',
  },
];

export const payment = [
  {
    amountPlanned: {
      currencyCode: 'EUR',
      centAmount: 100,
    },
  },
];

export const order = [
  {
    version: 3,
  },
];

export const cart = [
  {
    currency: 'EUR',
    taxMode: 'Disabled',
    shippingAddress: {
      country: 'DE',
    },
  },
];

export const taxCategories = [
  {
    key: 'test-key-' + 'rWI0dWVja3E',
    name: 'test-name-' + 'qWI0dWVpNXo',
    rates: [
      {
        name: 'test-tax-rate-name-' + 'xRunfJu',
        key: 'test-tax-rate-key-' + 'vTUioxzU',
        amount: 0.19,
        includedInPrice: true,
        country: 'DE',
        state: 'Berlin',
      },
    ],
  },
];

export const customLineItem = [
  {
    version: 1,
    actions: [
      {
        action: 'addCustomLineItem',
        name: {
          en: 'Name EN',
          de: 'Name DE',
        },
        quantity: 1,
        money: {
          currencyCode: 'EUR',
          centAmount: 4200,
        },
        slug: 'mySlug',
      },
    ],
  },
];
