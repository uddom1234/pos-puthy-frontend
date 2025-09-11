import React, { useState } from 'react';
import { Order } from '../../services/api';

interface PaymentProcessingModalProps {
  order: Order;
  onPaymentComplete: (paymentMethod: 'cash' | 'qr', discount?: number, cashReceived?: number) => void;
  onCancel: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  order,
  onPaymentComplete,
  onCancel
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');

  const calculateDiscountAmount = () => {
    if (discountType === 'percentage') {
      return (order.total * discount) / 100;
    }
    return discount;
  };

  const finalTotal = order.total - calculateDiscountAmount();
  const change = paymentMethod === 'cash' ? Math.max(0, cashReceived - finalTotal) : 0;

  const handleProcessPayment = () => {
    if (paymentMethod === 'cash') {
      if (cashReceived < finalTotal) {
        alert('Insufficient cash received');
        return;
      }
      onPaymentComplete(paymentMethod, calculateDiscountAmount(), cashReceived);
    } else {
      onPaymentComplete(paymentMethod, calculateDiscountAmount());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Process Payment</h2>
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
              Payment Method
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">Cash</span>
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">QR Code</span>
              </button>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Discount
            </label>
            <div className="flex space-x-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="input-field"
              >
                <option value="fixed">Fixed Amount ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="flex-1 input-field"
                placeholder="0"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Discount: ${calculateDiscountAmount().toFixed(2)}
            </p>
          </div>

          {/* Cash Received (only for cash payments) */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cash Received
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="w-full input-field"
                placeholder="0.00"
              />
              {cashReceived > 0 && cashReceived >= finalTotal && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Change: ${change.toFixed(2)}
                </p>
              )}
              {cashReceived > 0 && cashReceived < finalTotal && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Insufficient amount (need ${(finalTotal - cashReceived).toFixed(2)} more)
                </p>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900 dark:text-white">Subtotal:</span>
              <span className="text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
            </div>
            {calculateDiscountAmount() > 0 && (
              <div className="flex justify-between text-sm mb-2 text-green-600 dark:text-green-400">
                <span>Discount:</span>
                <span>-${calculateDiscountAmount().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={paymentMethod === 'cash' && cashReceived < finalTotal}
              className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
