import React, { useState, useEffect } from 'react';
import { productsAPI, customersAPI, transactionsAPI, ordersAPI, schemasAPI, categoriesAPI, Product, Customer, DynamicField, Order } from '../../services/api';
import { readAppSettings } from '../../contexts/AppSettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { printOrderReceipt } from '../../utils/printReceipt';
import DynamicForm from '../common/DynamicForm';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import CustomerLookup from './CustomerLookup';
import FloatingCartButton from './FloatingCartButton';
import {
  MagnifyingGlassIcon,
  UserIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  customizations?: {
    size?: 'small' | 'medium' | 'large';
    sugar?: 'less' | 'normal' | 'extra';
    addOns?: Array<{
      name: string;
      price: number;
    }>;
  };
  totalPrice: number;
}

const POS: React.FC = () => {
  const { t } = useLanguage();
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>(['coffee', 'food']);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderSchema, setOrderSchema] = useState<DynamicField[]>([]);
  const [orderMetadata, setOrderMetadata] = useState<Record<string, any>>({});

  // Cart persistence
  const CART_STORAGE_KEY = 'pos_cart_items';
  const CUSTOMER_STORAGE_KEY = 'pos_selected_customer';

  const saveCartToStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const loadCartFromStorage = (): CartItem[] => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  };

  const saveCustomerToStorage = (customer: Customer | null) => {
    try {
      if (customer) {
        localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving customer to localStorage:', error);
    }
  };

  const loadCustomerFromStorage = (): Customer | null => {
    try {
      const savedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      return savedCustomer ? JSON.parse(savedCustomer) : null;
    } catch (error) {
      console.error('Error loading customer from localStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    
    // Load saved data
    const savedCart = loadCartFromStorage();
    const savedCustomer = loadCustomerFromStorage();
    setCartItems(savedCart);
    setSelectedCustomer(savedCustomer);
    
    // Load order schema
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    (async () => {
      if (!user) return;
      try {
        const s = await schemasAPI.get('order');
        setOrderSchema(s.schema || []);
      } catch {}
    })();
  }, [categoryFilter]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.list();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll(categoryFilter === 'all' ? undefined : categoryFilter);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product, customizations?: any) => {
    let totalPrice = product.price;

    // Calculate price with customizations
    if (customizations?.addOns) {
      totalPrice += customizations.addOns.reduce((sum: number, addon: any) => sum + addon.price, 0);
    }
    
    // Apply dynamic optionSchema price deltas
    const optSchema: any[] = Array.isArray((product as any).optionSchema) ? (product as any).optionSchema : [];
    optSchema.forEach(group => {
      const applied = customizations?.[group.key];
      if (group.type === 'single' && applied) {
        const value = (applied?.value ?? applied) as string;
        const opt = (group.options || []).find((o: any) => o.value === value);
        if (opt) totalPrice += Number(opt.priceDelta || 0);
      } else if (group.type === 'multi' && Array.isArray(applied)) {
        applied.forEach((val: any) => {
          const value = (val?.value ?? val) as string;
          const opt = (group.options || []).find((o: any) => o.value === value);
          if (opt) totalPrice += Number(opt.priceDelta || 0);
        });
      }
    });

    setCartItems(prev => {
      const totalQtyForProduct = prev
        .filter(ci => ci.productId === product.id)
        .reduce((sum, ci) => sum + ci.quantity, 0);
      if (product.hasStock && typeof product.stock === 'number' && totalQtyForProduct >= product.stock) {
        return prev; // cannot add more; reached stock
      }
      // Check if the same product with same customizations already exists
      const existingItemIndex = prev.findIndex(item => 
        item.productId === product.id && 
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );

      let newCart;
      if (existingItemIndex !== -1) {
        // If item exists, increase quantity with stock guard
        const existing = prev[existingItemIndex];
        const desiredQty = existing.quantity + 1;
        if (product.hasStock && typeof product.stock === 'number') {
          const otherQty = totalQtyForProduct - existing.quantity;
          if (desiredQty + otherQty > product.stock) {
            return prev; // cap silently
          }
        }
        newCart = prev.map((item, index) => 
          index === existingItemIndex 
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: item.price * (item.quantity + 1)
              }
            : item
        );
      } else {
        // If item doesn't exist, create new cart item
        if (product.hasStock && typeof product.stock === 'number' && product.stock < 1) {
          return prev;
        }
        const cartItemId = `${product.id}_${Date.now()}`;
        const unitPrice = totalPrice; // price including deltas/add-ons per unit
        const cartItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          productName: product.name,
          price: unitPrice,
          quantity: 1,
          customizations,
          totalPrice: unitPrice * 1,
        };
        newCart = [...prev, cartItem];
      }
      
      saveCartToStorage(newCart);
      return newCart;
    });
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    setCartItems(prev => {
      const target = prev.find(i => i.id === itemId);
      if (target) {
        const product = products.find(p => p.id === target.productId);
        if (product && product.hasStock && typeof product.stock === 'number') {
          const otherQty = prev
            .filter(ci => ci.productId === target.productId && ci.id !== itemId)
            .reduce((sum, ci) => sum + ci.quantity, 0);
          const maxForThisLine = Math.max(0, product.stock - otherQty);
          if (quantity > maxForThisLine) quantity = maxForThisLine;
        }
      }
      let newCart;
      if (quantity <= 0) {
        newCart = prev.filter(item => item.id !== itemId);
      } else {
        newCart = prev.map(item =>
          item.id === itemId
            ? { ...item, quantity, totalPrice: item.price * quantity }
            : item
        );
      }
      saveCartToStorage(newCart);
      return newCart;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => {
      const newCart = prev.filter(item => item.id !== itemId);
      saveCartToStorage(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    saveCartToStorage([]);
    saveCustomerToStorage(null);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    saveCustomerToStorage(customer);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const handlePayment = async (paymentData: {
    paymentMethod: 'cash' | 'qr';
    discount: number;
    loyaltyPointsUsed?: number;
    cashReceived?: number;
    status?: 'paid' | 'unpaid';
    currency?: 'USD' | 'KHR';
  }) => {
    try {
      const subtotal = getCartTotal();
      const total = subtotal - paymentData.discount - (paymentData.loyaltyPointsUsed || 0);

      const statusValue: 'paid' | 'unpaid' = paymentData.status
        ? paymentData.status
        : (paymentData.paymentMethod === 'cash' ? 'paid' : 'unpaid');

      let customerIdToUse: string | undefined = selectedCustomer?.id;

      const transaction = {
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customizations,
        })),
        subtotal,
        discount: paymentData.discount,
        total,
        paymentMethod: paymentData.paymentMethod,
        status: statusValue,
        customerId: customerIdToUse,
        loyaltyPointsUsed: paymentData.loyaltyPointsUsed || 0,
        loyaltyPointsEarned: Math.floor(total * 0.1),
        cashReceived: paymentData.paymentMethod === 'cash' ? (paymentData.cashReceived || 0) : 0,
      };

      const createdOrder: Order = await ordersAPI.create({
        customerId: customerIdToUse,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customizations,
        })),
        total,
        tableNumber: undefined,
        notes: undefined,
        metadata: orderSchema.length > 0 ? orderMetadata : {},
      } as any);

      // Immediately reflect payment on the order if status is paid
      if (statusValue === 'paid') {
        try {
          await ordersAPI.updatePayment(createdOrder.id, 'paid', paymentData.paymentMethod, paymentData.discount, paymentData.cashReceived);
          createdOrder.paymentStatus = 'paid';
          createdOrder.paymentMethod = paymentData.paymentMethod;
        } catch (e) {
          console.warn('Failed to update order payment immediately:', e);
        }
      }

      printOrderReceipt(createdOrder, { paymentMethod: paymentData.paymentMethod, status: statusValue, customer: selectedCustomer });

      if (customerIdToUse && transaction.loyaltyPointsEarned > 0) {
        await customersAPI.updatePoints(
          customerIdToUse,
          transaction.loyaltyPointsEarned,
          'add'
        );
      }

      if (customerIdToUse && paymentData.loyaltyPointsUsed && transaction.status === 'paid') {
        await customersAPI.updatePoints(
          customerIdToUse,
          paymentData.loyaltyPointsUsed,
          'subtract'
        );
      }

      clearCart();
      setOrderMetadata({});
      setShowCartModal(false);
      setShowPaymentModal(false);
      alert('Payment successful!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smach Cafe POS</h1>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {['all', ...categories].map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    categoryFilter === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('search_products_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <ProductGrid
          products={filteredProducts}
          onAddToCart={addToCart}
          loading={loading}
          cartItems={cartItems}
          onStockBlocked={(msg) => {
            const el = document.createElement('div');
            el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-[10000]';
            el.textContent = msg;
            document.body.appendChild(el);
            setTimeout(() => { el.remove(); }, 1800);
          }}
        />
      </div>

      {/* Floating Cart Button */}
      <FloatingCartButton
        itemCount={getCartItemCount()}
        total={getCartTotal()}
        onClick={() => setShowCartModal(true)}
      />

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('cart')} ({getCartItemCount()})</h2>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Cart
                items={cartItems}
                onUpdateItem={updateCartItem}
                onRemoveItem={removeFromCart}
                onClear={clearCart}
                products={products}
                onStockBlocked={(msg) => {
                  // lightweight toast-like modal
                  const el = document.createElement('div');
                  el.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-[10000]';
                  el.textContent = msg;
                  document.body.appendChild(el);
                  setTimeout(() => { el.remove(); }, 1800);
                }}
              />

              {/* Order custom fields */}
              {orderSchema.length > 0 && (
                <div className="mt-6 card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Order Details</h3>
                  <DynamicForm schema={orderSchema} values={orderMetadata} onChange={setOrderMetadata} />
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('total')}: ${getCartTotal().toFixed(2)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCustomerLookup(true)}
                    className="btn-outline px-4 py-2 flex items-center space-x-2"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>{t('customer')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCartModal(false);
                      setShowPaymentModal(true);
                    }}
                    disabled={cartItems.length === 0}
                    className="btn-primary px-6 py-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <CreditCardIcon className="h-6 w-6" />
                    <span>{t('checkout')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Lookup Modal */}
      {showCustomerLookup && (
        <CustomerLookup
          isOpen={showCustomerLookup}
          onClose={() => setShowCustomerLookup(false)}
          onSelectCustomer={handleCustomerSelect}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onBack={() => {
            setShowPaymentModal(false);
            setShowCartModal(true);
          }}
          onPayment={handlePayment}
          total={getCartTotal()}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
};

export default POS;