import { CurrencyCode, CurrencyInfo } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: '欧元 (EUR)',
    nativeName: 'Euro',
    flag: '🇪🇺',
    locale: 'de-AT',
    symbolPosition: 'before',
    exchangeRateToEur: 1.0,
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: '捷克克朗 (CZK)',
    nativeName: 'Česká koruna',
    flag: '🇨🇿',
    locale: 'cs-CZ',
    symbolPosition: 'after',
    exchangeRateToEur: 25.2,
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    name: '匈牙利福林 (HUF)',
    nativeName: 'Magyar forint',
    flag: '🇭🇺',
    locale: 'hu-HU',
    symbolPosition: 'after',
    exchangeRateToEur: 395.0,
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: '波兰兹罗提 (PLN)',
    nativeName: 'Polski złoty',
    flag: '🇵🇱',
    locale: 'pl-PL',
    symbolPosition: 'after',
    exchangeRateToEur: 4.3,
  },
};

/**
 * 格式化货币金额显示
 * 支持 EUR (€), CZK (Kč), HUF (Ft), PLN (zł)
 */
export function formatCurrency(amount: number, currencyCodeOrSymbol: CurrencyCode | string = 'EUR'): string {
  const code = (currencyCodeOrSymbol in SUPPORTED_CURRENCIES) 
    ? (currencyCodeOrSymbol as CurrencyCode) 
    : 'EUR';
  
  const curr = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.EUR;
  
  // HUF 通常无小数位，EUR/CZK/PLN 保留两位小数
  const decimals = code === 'HUF' ? 0 : 2;
  const formattedNum = (amount || 0).toLocaleString(curr.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (curr.symbolPosition === 'before') {
    return `${curr.symbol} ${formattedNum}`;
  } else {
    return `${formattedNum} ${curr.symbol}`;
  }
}
