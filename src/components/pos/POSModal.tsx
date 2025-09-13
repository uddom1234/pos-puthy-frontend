import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon, CreditCardIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { productsAPI, customersAPI, transactionsAPI, ordersAPI, schemasAPI, categoriesAPI, Product, Customer, DynamicField, Order } from '../../services/api';
import { readAppSettings } from '../../contexts/AppSettingsContext';
import { printOrderReceipt } from '../../utils/printReceipt';
import DynamicForm from '../common/DynamicForm';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import CustomerLookup from './CustomerLookup';

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

type POSStep = 'products' | 'cart' | 'payment';

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POSModal: React.FC<POSModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<POSStep>('products');
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
    if (isOpen) {
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
          const s = await schemasAPI.get(user.id, 'order');
          setOrderSchema(s.schema || []);
        } catch {}
      })();
    }
  }, [isOpen, categoryFilter]);

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
        const opt = (group.options || []).find((o: any) => o.value === applied);
        if (opt) totalPrice += Number(opt.priceDelta || 0);
      } else if (group.type === 'multi' && Array.isArray(applied)) {
        applied.forEach((val: string) => {
          const opt = (group.options || []).find((o: any) => o.value === val);
          if (opt) totalPrice += Number(opt.priceDelta || 0);
        });
      }
    });

    setCartItems(prev => {
      // Check if the same product with same customizations already exists
      const existingItemIndex = prev.findIndex(item => 
        item.productId === product.id && 
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );

      let newCart;
      if (existingItemIndex !== -1) {
        // If item exists, increase quantity
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
        const cartItemId = `${product.id}_${Date.now()}`;
        const cartItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          customizations,
          totalPrice,
        };
        newCart = [...prev, cartItem];
      }
      
      saveCartToStorage(newCart);
      return newCart;
    });
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    setCartItems(prev => {
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

  const handlePayment = async (paymentData: {
    paymentMethod: 'cash' | 'qr';
    discount: number;
    loyaltyPointsUsed?: number;
    cashReceived?: number;
    status?: 'paid' | 'unpaid';
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
        cashReceived: paymentData.paymentMethod === 'cash' ? paymentData.cashReceived : undefined,
      };

      await transactionsAPI.create(transaction);

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
      setCurrentStep('products');
      alert('Payment successful!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleClose = () => {
    setCurrentStep('products');
    setSearchTerm('');
    setCategoryFilter('all');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            {currentStep !== 'products' && (
              <button
                onClick={() => setCurrentStep('products')}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Products"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smach Cafe POS</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStep === 'products' && 'Select products to add to cart'}
                {currentStep === 'cart' && 'Review your order'}
                {currentStep === 'payment' && 'Process payment'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'products' && (
            <div className="h-full flex flex-col">
              {/* Filters and Search */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
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

                {/* Search Bar */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <ProductGrid
                  products={filteredProducts}
                  onAddToCart={addToCart}
                  loading={loading}
                />
              </div>
            </div>
          )}

          {currentStep === 'cart' && (
            <div className="h-full flex flex-col">
              {/* Cart Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shopping Cart</h2>
                  <div className="flex items-center space-x-4">
                    {/* Customer Section */}
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      {selectedCustomer ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.name}</span>
                          <button
                            onClick={() => setSelectedCustomer(null)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCustomerLookup(true)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Add Customer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <Cart
                  items={cartItems}
                  onUpdateItem={updateCartItem}
                  onRemoveItem={removeFromCart}
                  onClear={clearCart}
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
                    Total: ${getCartTotal().toFixed(2)}
                  </div>
                  <button
                    onClick={() => setCurrentStep('payment')}
                    disabled={cartItems.length === 0}
                    className="btn-primary px-6 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <CreditCardIcon className="h-6 w-6" />
                    <span>Process Payment</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'payment' && (
            <div className="h-full">
              <PaymentModal
                isOpen={true}
                onClose={() => setCurrentStep('cart')}
                onPayment={handlePayment}
                total={getCartTotal()}
                customer={selectedCustomer}
              />
            </div>
          )}
        </div>
      </div>

      {/* Customer Lookup Modal */}
      {showCustomerLookup && (
        <CustomerLookup
          isOpen={showCustomerLookup}
          onClose={() => setShowCustomerLookup(false)}
          onSelectCustomer={handleCustomerSelect}
        />
      )}
    </div>
  );
};

export default POSModal;
