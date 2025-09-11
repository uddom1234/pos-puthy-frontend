import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductCustomizationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: any) => void;
}

interface AddOn {
  name: string;
  price: number;
}

const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [customizations, setCustomizations] = useState<{
    size?: 'small' | 'medium' | 'large';
    sugar?: 'less' | 'normal' | 'extra';
    addOns: AddOn[];
    [key: string]: any;
  }>({
    size: product.category === 'coffee' ? 'medium' : undefined,
    sugar: product.category === 'coffee' ? 'normal' : undefined,
    addOns: [],
  });

  // Coffee customization options
  const coffeeAddOns: AddOn[] = [
    { name: 'Extra Shot', price: 0.75 },
    { name: 'Decaf', price: 0 },
    { name: 'Soy Milk', price: 0.50 },
    { name: 'Almond Milk', price: 0.60 },
    { name: 'Vanilla Syrup', price: 0.50 },
    { name: 'Caramel Syrup', price: 0.50 },
  ];

  // Food customization options
  const foodAddOns: AddOn[] = [
    { name: 'Extra Meat', price: 2.50 },
    { name: 'Extra Cheese', price: 1.50 },
    { name: 'Avocado', price: 1.00 },
    { name: 'Bacon', price: 2.00 },
    { name: 'Extra Sauce', price: 0.50 },
    { name: 'Side Salad', price: 3.00 },
  ];

  // Prefer dynamic optionSchema if present; otherwise fallback to legacy coffee/food presets
  const hasDynamic = Array.isArray((product as any).optionSchema) && (product as any).optionSchema.length > 0;
  const availableAddOns = product.category === 'coffee' ? coffeeAddOns : foodAddOns;

  const getSizePrice = () => {
    if (product.category !== 'coffee' || !customizations.size) return 0;
    
    switch (customizations.size) {
      case 'small': return -0.50;
      case 'large': return 0.75;
      default: return 0;
    }
  };

  const getDynamicPrice = () => {
    if (!hasDynamic) return 0;
    const schema: any[] = (product as any).optionSchema || [];
    let delta = 0;
    schema.forEach(group => {
      const applied = (customizations as any)[group.key];
      if (group.type === 'single' && applied) {
        const opt = (group.options || []).find((o: any) => o.value === applied);
        if (opt) delta += Number(opt.priceDelta || 0);
      } else if (group.type === 'multi' && Array.isArray(applied)) {
        applied.forEach((val: string) => {
          const opt = (group.options || []).find((o: any) => o.value === val);
          if (opt) delta += Number(opt.priceDelta || 0);
        });
      }
    });
    return delta;
  };

  const getTotalPrice = () => {
    const basePrice = product.price;
    const sizePrice = getSizePrice();
    const addOnsPrice = customizations.addOns.reduce((sum, addon) => sum + addon.price, 0);
    const dynamicPrice = getDynamicPrice();
    return basePrice + sizePrice + addOnsPrice + dynamicPrice;
  };

  // Autofocus modal and close on Escape
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Preselect first option for required single-choice groups
  useEffect(() => {
    if (!hasDynamic) return;
    const schema: any[] = (product as any).optionSchema || [];
    const next: any = { ...customizations };
    schema.forEach(group => {
      if (group.type === 'single' && group.required && !next[group.key]) {
        const first = (group.options || [])[0];
        if (first) next[group.key] = first.value;
      }
      if (group.type === 'multi' && group.required && !Array.isArray(next[group.key])) {
        next[group.key] = [];
      }
    });
    setCustomizations(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDynamic, product]);

  const missingRequired = useMemo(() => {
    if (!hasDynamic) return [] as string[];
    const schema: any[] = (product as any).optionSchema || [];
    const out: string[] = [];
    schema.forEach(group => {
      if (!group.required) return;
      const val = (customizations as any)[group.key];
      if (group.type === 'single' && !val) out.push(group.label || group.key);
      if (group.type === 'multi' && (!Array.isArray(val) || val.length === 0)) out.push(group.label || group.key);
    });
    return out;
  }, [customizations, hasDynamic, product]);

  const handleAddOnToggle = (addon: AddOn) => {
    setCustomizations(prev => ({
      ...prev,
      addOns: prev.addOns.some(item => item.name === addon.name)
        ? prev.addOns.filter(item => item.name !== addon.name)
        : [...prev.addOns, addon],
    }));
  };

  const handleAddToCart = () => {
    if (missingRequired.length > 0) return;
    onAddToCart(customizations);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div className="h-full w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <div
          ref={containerRef}
          className="modal-content max-w-md w-full mx-4"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customize {product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Dynamic option groups */}
            {hasDynamic && (
              <div className="space-y-6">
                {((product as any).optionSchema as any[]).map((group: any) => (
                  <div key={group.key}>
                    <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                      {group.label}
                      {group.required && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 align-middle">required</span>}
                    </h3>
                    <div className="space-y-2">
                      {group.type === 'single' ? (
                        (group.options || []).map((opt: any) => (
                          <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name={`dyn_${group.key}`}
                              value={opt.value}
                              checked={(customizations as any)[group.key] === opt.value}
                              onChange={(e) => setCustomizations(prev => ({ ...prev, [group.key]: e.target.value }))}
                              className="text-primary-600"
                            />
                            <span className="flex-1 text-gray-900 dark:text-white">{opt.label}</span>
                            <span className="text-gray-600 dark:text-gray-400">{opt.priceDelta >= 0 ? `+$${opt.priceDelta.toFixed(2)}` : `-$${Math.abs(opt.priceDelta).toFixed(2)}`}</span>
                          </label>
                        ))
                      ) : (
                        (group.options || []).map((opt: any) => (
                          <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Array.isArray((customizations as any)[group.key]) && (customizations as any)[group.key].includes(opt.value)}
                              onChange={(e) => {
                                const curr = Array.isArray((customizations as any)[group.key]) ? [...(customizations as any)[group.key]] : [];
                                if (e.target.checked) curr.push(opt.value); else {
                                  const i = curr.indexOf(opt.value); if (i >= 0) curr.splice(i, 1);
                                }
                                setCustomizations(prev => ({ ...prev, [group.key]: curr }));
                              }}
                              className="text-primary-600"
                            />
                            <span className="flex-1 text-gray-900 dark:text-white">{opt.label}</span>
                            <span className="text-gray-600 dark:text-gray-400">{opt.priceDelta >= 0 ? `+$${opt.priceDelta.toFixed(2)}` : `-$${Math.abs(opt.priceDelta).toFixed(2)}`}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ))}
                {missingRequired.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
                    Please select: {missingRequired.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Size Selection for Coffee (legacy) */}
            {!hasDynamic && product.category === 'coffee' && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Size</h3>
                <div className="space-y-2">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <label key={size} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        value={size}
                        checked={customizations.size === size}
                        onChange={(e) => setCustomizations(prev => ({ ...prev, size: e.target.value as any }))}
                        className="text-primary-600"
                      />
                      <span className="flex-1 text-gray-900 dark:text-white">{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {size === 'small' && '-$0.50'}
                        {size === 'medium' && '$0.00'}
                        {size === 'large' && '+$0.75'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sugar Level for Coffee (legacy) */}
            {!hasDynamic && product.category === 'coffee' && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Sugar Level</h3>
                <div className="space-y-2">
                  {(['less', 'normal', 'extra'] as const).map(sugar => (
                    <label key={sugar} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sugar"
                        value={sugar}
                        checked={customizations.sugar === sugar}
                        onChange={(e) => setCustomizations(prev => ({ ...prev, sugar: e.target.value as any }))}
                        className="text-primary-600"
                      />
                      <span className="text-gray-900 dark:text-white">{sugar.charAt(0).toUpperCase() + sugar.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Add-ons */}
            {!hasDynamic && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Add-ons</h3>
                <div className="space-y-2">
                  {availableAddOns.map(addon => (
                    <label key={addon.name} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customizations.addOns.some(item => item.name === addon.name)}
                        onChange={() => handleAddOnToggle(addon)}
                        className="text-primary-600"
                      />
                      <span className="flex-1 text-gray-900 dark:text-white">{addon.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {addon.price > 0 ? `+$${addon.price.toFixed(2)}` : 'Free'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Total Price:</span>
                <span className="text-primary-600 dark:text-primary-400">${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex space-x-3 sticky bottom-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={missingRequired.length > 0}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCustomizationModal;