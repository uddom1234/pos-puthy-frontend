import React, { useState } from 'react';
import { Customer } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { readAppSettings } from '../../contexts/AppSettingsContext';
import { XMarkIcon, BanknotesIcon, QrCodeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import NumberInput from '../common/NumberInput';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onPayment: (paymentData: {
    paymentMethod: 'cash' | 'qr';
    discount: number;
    loyaltyPointsUsed?: number;
    cashReceived?: number;
    status?: 'paid' | 'unpaid';
    currency?: 'USD' | 'KHR';
  }) => void;
  total: number;
  customer?: Customer | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onPayment,
  total,
  customer,
}) => {
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  // QR specific status removed; QR is treated as paid upon processing

  const calculateDiscount = () => {
    if (discountType === 'percentage') {
      return (total * discountValue) / 100;
    }
    return discountValue;
  };

  const getDiscountedTotal = () => {
    return Math.max(0, total - calculateDiscount() - loyaltyPointsUsed);
  };

  const getChange = () => {
    if (paymentMethod !== 'cash') return 0;
    return Math.max(0, cashReceived - getDiscountedTotal());
  };

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
      return convertToKhr(total);
    }
    return total;
  };

  const getDisplayDiscountedTotal = () => {
    if (currency === 'KHR') {
      return convertToKhr(getDiscountedTotal());
    }
    return getDiscountedTotal();
  };

  const getDisplayCashReceived = () => {
    if (currency === 'KHR') {
      return convertToKhr(cashReceived);
    }
    return cashReceived;
  };

  const getDisplayChange = () => {
    if (currency === 'KHR') {
      return convertToKhr(getChange());
    }
    return getChange();
  };

  const canProcessPayment = () => {
    const finalTotal = getDiscountedTotal();
    
    if (paymentMethod === 'cash') {
      return cashReceived >= finalTotal;
    }
    
    return finalTotal >= 0;
  };

  const handlePayment = () => {
    if (!canProcessPayment()) return;

    onPayment({
      paymentMethod,
      discount: calculateDiscount(),
      loyaltyPointsUsed: loyaltyPointsUsed || 0,
      cashReceived: paymentMethod === 'cash' ? cashReceived : 0,
      status: 'paid',
      currency,
    });
  };

  const maxLoyaltyPoints = customer ? Math.min(customer.loyaltyPoints, total) : 0;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('process_payment')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Options */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">{t('payment_method')}</h3>
            <div className="space-y-3">
              {/* Immediate Payment Methods */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { method: 'cash' as const, icon: BanknotesIcon, label: t('cash') },
                  { method: 'qr' as const, icon: QrCodeIcon, label: t('qr_code') },
                ].map(({ method, icon: Icon, label }) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      paymentMethod === method
                        ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>

              {/* Pay Later Option */}
              <button
                type="button"
                onClick={() =>
                  onPayment({
                    paymentMethod,
                    discount: calculateDiscount(),
                    loyaltyPointsUsed: loyaltyPointsUsed || 0,
                    cashReceived: 0,
                    status: 'unpaid',
                    currency,
                  })
                }
                className="w-full p-4 border-2 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t('pay_later')}</span>
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Currency</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'USD' as const, label: 'US Dollar ($)', symbol: '$' },
                { code: 'KHR' as const, label: 'Cambodian Riel (៛)', symbol: '៛' },
              ].map(({ code, label, symbol }) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    currency === code
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">{symbol}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{t('discount')}</span>
            </h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="input-field flex-shrink-0 w-40"
                >
                  <option value="fixed">{t('fixed_amount')}</option>
                  <option value="percentage">{t('percentage')}</option>
                </select>
                <NumberInput
                  value={discountValue}
                  onChange={(value) => setDiscountValue(value || 0)}
                  min={0}
                  max={discountType === 'percentage' ? 100 : total}
                  placeholder="0"
                  className="input-field flex-1 min-w-0"
                  allowDecimals={true}
                />
              </div>
              {calculateDiscount() > 0 && (
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                    {t('discount')}: ${calculateDiscount().toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>


          {/* Loyalty Points */}
          {customer && customer.loyaltyPoints > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">{t('use_loyalty_points')}</h3>
              <div className="space-y-2">
                <NumberInput
                  value={loyaltyPointsUsed}
                  onChange={(value) => setLoyaltyPointsUsed(value || 0)}
                  min={0}
                  max={maxLoyaltyPoints}
                  placeholder="0"
                  className="input-field w-full"
                  allowDecimals={false}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('available')}: {customer.loyaltyPoints} {t('points')} ({t('point_equals_dollar')})
                </p>
              </div>
            </div>
          )}

          {/* Customer selection handled via separate modal */}

          {/* Cash Received */}
          {paymentMethod === 'cash' && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                {t('cash_received')} ({currency})
              </h3>
              <NumberInput
                value={getDisplayCashReceived()}
                onChange={(value) => {
                  const convertedValue = currency === 'KHR' ? convertToUsd(value || 0) : (value || 0);
                  setCashReceived(convertedValue);
                }}
                min={0}
                placeholder={currency === 'KHR' ? "0" : "0.00"}
                className="input-field w-full"
                allowDecimals={currency === 'USD'}
                step={currency === 'KHR' ? 100 : 0.01}
              />
              {cashReceived > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('change')}: {currency === 'KHR' 
                    ? `៛${Math.round(getDisplayChange()).toLocaleString()}`
                    : `$${getDisplayChange().toFixed(2)}`
                  }
                </p>
              )}
            </div>
          )}

          {/* QR section no longer includes payment status */}

          {/* Payment Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-900 dark:text-white">{t('subtotal')}:</span>
              <span className="text-gray-900 dark:text-white">
                {currency === 'KHR' 
                  ? `៛${Math.round(getDisplayTotal()).toLocaleString()}`
                  : `$${getDisplayTotal().toFixed(2)}`
                }
              </span>
            </div>
            {calculateDiscount() > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>{t('discount')}:</span>
                <span>
                  {currency === 'KHR' 
                    ? `-៛${Math.round(convertToKhr(calculateDiscount())).toLocaleString()}`
                    : `-$${calculateDiscount().toFixed(2)}`
                  }
                </span>
              </div>
            )}
            {loyaltyPointsUsed > 0 && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>{t('loyalty_points')}:</span>
                <span>
                  {currency === 'KHR' 
                    ? `-៛${Math.round(convertToKhr(loyaltyPointsUsed)).toLocaleString()}`
                    : `-$${loyaltyPointsUsed.toFixed(2)}`
                  }
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">
                {currency === 'KHR' 
                  ? `៛${Math.round(getDisplayDiscountedTotal()).toLocaleString()}`
                  : `$${getDisplayDiscountedTotal().toFixed(2)}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
{t('cancel')}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>{t('back')}</span>
            </button>
          )}
          <button
            onClick={handlePayment}
            disabled={!canProcessPayment()}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
{t('process_payment')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;