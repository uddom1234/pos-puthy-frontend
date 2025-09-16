import { useState, useEffect } from 'react';
import { currencyRatesAPI } from '../services/api';
import { readAppSettings } from '../contexts/AppSettingsContext';

export interface CurrencyRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  is_active: boolean;
}

export const useCurrency = () => {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const data = await currencyRatesAPI.getAll();
      setRates(data);
    } catch (error) {
      console.error('Error fetching currency rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRate = (from: string, to: string): number => {
    const rate = rates.find(r => r.from_currency === from && r.to_currency === to);
    return rate?.rate || 0;
  };

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    const rate = getRate(from, to);
    return amount * rate;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    if (currency === 'KHR') {
      return `៛${Math.round(amount).toLocaleString()}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getUsdToKhrRate = (): number => {
    const apiRate = getRate('USD', 'KHR');
    if (apiRate > 0) return apiRate;
    
    const settings = readAppSettings();
    return settings.currencyRate && settings.currencyRate > 0 ? settings.currencyRate : 4100;
  };

  const getKhrToUsdRate = (): number => {
    const apiRate = getRate('KHR', 'USD');
    if (apiRate > 0) return apiRate;
    
    const settings = readAppSettings();
    const usdToKhrRate = settings.currencyRate && settings.currencyRate > 0 ? settings.currencyRate : 4100;
    return 1 / usdToKhrRate;
  };

  return {
    rates,
    loading,
    getRate,
    convertCurrency,
    formatCurrency,
    getUsdToKhrRate,
    getKhrToUsdRate,
    refreshRates: fetchRates,
  };
};
