export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateFromUSD: number; // How many units of this currency = 1 USD
}

export const currencies: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateFromUSD: 83 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rateFromUSD: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateFromUSD: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateFromUSD: 0.79 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateFromUSD: 1.53 },
];

export const defaultCurrency = currencies[0]; // INR

export const convertPrice = (usdPrice: number, toCurrency: Currency): number => {
  return Math.round(usdPrice * toCurrency.rateFromUSD);
};

export const formatPrice = (amount: number, currency: Currency): string => {
  return `${currency.symbol}${amount.toLocaleString()}`;
};

export const getCurrencyByCode = (code: string): Currency => {
  return currencies.find(c => c.code === code) || defaultCurrency;
};
