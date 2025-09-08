import React from 'react';
import { readAppSettings } from '../../contexts/AppSettingsContext';
import { CartItem } from './POS';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CartProps {
  items: CartItem[];
  onUpdateItem: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClear: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateItem, onRemoveItem, onClear }) => {
  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };
  const rate = readAppSettings().currencyRate || 4100;

  const formatCustomizations = (customizations?: any) => {
    if (!customizations) return '';
    
    const parts = [];
    
    if (customizations.size) {
      parts.push(`Size: ${customizations.size}`);
    }
    
    if (customizations.sugar) {
      parts.push(`Sugar: ${customizations.sugar}`);
    }
    
    if (customizations.addOns && customizations.addOns.length > 0) {
      parts.push(`Add-ons: ${customizations.addOns.map((addon: any) => addon.name).join(', ')}`);
    }
    
    return parts.join(' • ');
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-lg">Your cart is empty</p>
        <p className="text-sm">Add items to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Cart ({items.length})</h3>
        <button
          onClick={onClear}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.productName}</h4>
                {item.customizations && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCustomizations(item.customizations)}
                  </p>
                )}
              </div>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  disabled={item.quantity <= 1}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right">
                <div className="font-semibold">${item.totalPrice.toFixed(2)}</div>
                <div className="text-xs text-gray-500">៛ {(item.totalPrice * rate).toFixed(0)}</div>
                <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Subtotal:</span>
          <span className="text-right">
            <div>${getSubtotal().toFixed(2)}</div>
            <div className="text-sm text-gray-500">៛ {(getSubtotal() * rate).toFixed(0)}</div>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Cart;