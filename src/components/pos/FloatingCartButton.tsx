import React from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface FloatingCartButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount,
  total,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 group"
    >
      <div className="relative">
        <ShoppingCartIcon className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {itemCount}
          </span>
        )}
      </div>
      {itemCount > 0 && (
        <div className="hidden sm:block">
          <div className="text-sm font-semibold">${total.toFixed(2)}</div>
          <div className="text-xs opacity-90">{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
        </div>
      )}
    </button>
  );
};

export default FloatingCartButton;
