import React, { useState } from 'react';
import { Customer } from '../../services/api';
import { XMarkIcon, BanknotesIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: (paymentData: {
    paymentMethod: 'cash' | 'qr';
    discount: number;
    loyaltyPointsUsed?: number;
    cashReceived?: number;
    status?: 'paid' | 'unpaid';
  }) => void;
  total: number;
  customer?: Customer | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPayment,
  total,
  customer,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
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
      loyaltyPointsUsed: loyaltyPointsUsed || undefined,
      cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      status: 'paid',
    });
  };

  const maxLoyaltyPoints = customer ? Math.min(customer.loyaltyPoints, total) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Process Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Method + Pay Later */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Payment Method</h3>
              <button
                type="button"
                onClick={() =>
                  onPayment({
                    paymentMethod,
                    discount: calculateDiscount(),
                    loyaltyPointsUsed: loyaltyPointsUsed || undefined,
                    cashReceived: undefined,
                    status: 'unpaid',
                  })
                }
                className="px-3 py-1.5 border border-yellow-300 text-yellow-800 rounded-lg hover:bg-yellow-50 text-sm"
              >
                Pay Later
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { method: 'cash' as const, icon: BanknotesIcon, label: 'Cash' },
                { method: 'qr' as const, icon: QrCodeIcon, label: 'QR Code' },
              ].map(({ method, icon: Icon, label }) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    paymentMethod === method
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <h3 className="text-lg font-medium mb-3">Discount</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="fixed">Fixed Amount ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? 100 : total}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <p className="text-sm text-gray-600">
                Discount: ${calculateDiscount().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Loyalty Points */}
          {customer && customer.loyaltyPoints > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Use Loyalty Points</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  max={maxLoyaltyPoints}
                  value={loyaltyPointsUsed}
                  onChange={(e) => setLoyaltyPointsUsed(Number(e.target.value))}
                  className="input-field"
                  placeholder="0"
                />
                <p className="text-sm text-gray-600">
                  Available: {customer.loyaltyPoints} points (1 point = $1)
                </p>
              </div>
            </div>
          )}

          {/* Customer selection handled via separate modal */}

          {/* Cash Received */}
          {paymentMethod === 'cash' && (
            <div>
              <h3 className="text-lg font-medium mb-3">Cash Received</h3>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="input-field"
                placeholder="0.00"
              />
              {cashReceived > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Change: ${getChange().toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* QR section no longer includes payment status */}

          {/* Payment Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {calculateDiscount() > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-${calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            {loyaltyPointsUsed > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Loyalty Points:</span>
                <span>-${loyaltyPointsUsed.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${getDiscountedTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={!canProcessPayment()}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;