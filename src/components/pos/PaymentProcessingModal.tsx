import React, { useState } from 'react';
import { Order } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { readAppSettings } from '../../contexts/AppSettingsContext';
import NumberInput from '../common/NumberInput';

interface PaymentProcessingModalProps {
  order: Order;
  onPaymentComplete: (paymentMethod: 'cash' | 'qr', discount?: number, cashReceived?: number, currency?: 'USD' | 'KHR') => void;
  onCancel: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  order,
  onPaymentComplete,
  onCancel
}) => {
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');

  const calculateDiscountAmount = () => {
    if (discountType === 'percentage') {
      return (order.total * discount) / 100;
    }
    return discount;
  };

  const finalTotal = order.total - calculateDiscountAmount();
  const change = paymentMethod === 'cash' ? Math.max(0, cashReceived - finalTotal) : 0;

  const convertToKhr = (usdAmount: number) => {
    const settings = readAppSettings();
    const rate = settings.currencyRate && settings.currencyRate > 0 ? Number(settings.currencyRate) : 4100;
    return usdAmount * rate;
  };

  const convertToUsd = (khrAmount: number) => {
    const settings = readAppSettings();
    const rate = settings.currencyRate && settings.currencyRate > 0 ? Number(settings.currencyRate) : 4100;
    return khrAmount / rate;
  };

  const getDisplayTotal = () => {
    if (currency === 'KHR') {
      return convertToKhr(finalTotal);
    }
    return finalTotal;
  };

  const getDisplayCashReceived = () => {
    if (currency === 'KHR') {
      return convertToKhr(cashReceived);
    }
    return cashReceived;
  };

  const getDisplayChange = () => {
    if (currency === 'KHR') {
      return convertToKhr(change);
    }
    return change;
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'cash') {
      if (cashReceived < finalTotal) {
        alert('Insufficient cash received');
        return;
      }
      onPaymentComplete(paymentMethod, calculateDiscountAmount(), cashReceived, currency);
    } else {
      onPaymentComplete(paymentMethod, calculateDiscountAmount(), undefined, currency);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('process_payment')}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('payment_method')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 ${
                  paymentMethod === 'cash' 
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('cash')}</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 ${
                  paymentMethod === 'qr' 
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('qr_code')}</span>
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Currency
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrency('USD')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 ${
                  currency === 'USD' 
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">$</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">USD</span>
              </button>
              
              <button
                onClick={() => setCurrency('KHR')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 ${
                  currency === 'KHR' 
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">៛</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">KHR</span>
              </button>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('discount')}
            </label>
            <div className="flex space-x-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="input-field"
              >
                <option value="fixed">{t('fixed_amount')}</option>
                <option value="percentage">{t('percentage')}</option>
              </select>
              <NumberInput
                value={discount}
                onChange={(value) => setDiscount(value || 0)}
                min={0}
                step={0.01}
                placeholder="0"
                className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                allowDecimals={true}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('discount')}: ${calculateDiscountAmount().toFixed(2)}
            </p>
          </div>

          {/* Cash Received (only for cash payments) */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('cash_received')} ({currency})
              </label>
              <NumberInput
                value={getDisplayCashReceived()}
                onChange={(value) => {
                  const convertedValue = currency === 'KHR' ? convertToUsd(value || 0) : (value || 0);
                  setCashReceived(convertedValue);
                }}
                min={0}
                step={currency === 'KHR' ? 100 : 0.01}
                placeholder={currency === 'KHR' ? "0" : "0.00"}
                className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                allowDecimals={currency === 'USD'}
              />
              {cashReceived > 0 && cashReceived >= finalTotal && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {t('change')}: {currency === 'KHR' 
                    ? `៛${Math.round(getDisplayChange()).toLocaleString()}`
                    : `$${getDisplayChange().toFixed(2)}`
                  }
                </p>
              )}
              {cashReceived > 0 && cashReceived < finalTotal && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Insufficient amount (need {currency === 'KHR' 
                    ? `៛${Math.round(convertToKhr(finalTotal - cashReceived)).toLocaleString()}`
                    : `$${(finalTotal - cashReceived).toFixed(2)}`
                  } more)
                </p>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900 dark:text-white">{t('subtotal')}:</span>
              <span className="text-gray-900 dark:text-white">
                {currency === 'KHR' 
                  ? `៛${Math.round(convertToKhr(order.total)).toLocaleString()}`
                  : `$${order.total.toFixed(2)}`
                }
              </span>
            </div>
            {calculateDiscountAmount() > 0 && (
              <div className="flex justify-between text-sm mb-2 text-green-600 dark:text-green-400">
                <span>{t('discount')}:</span>
                <span>
                  {currency === 'KHR' 
                    ? `-៛${Math.round(convertToKhr(calculateDiscountAmount())).toLocaleString()}`
                    : `-$${calculateDiscountAmount().toFixed(2)}`
                  }
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">
                {currency === 'KHR' 
                  ? `៛${Math.round(getDisplayTotal()).toLocaleString()}`
                  : `$${getDisplayTotal().toFixed(2)}`
                }
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={paymentMethod === 'cash' && cashReceived < finalTotal}
              className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
{t('process_payment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
