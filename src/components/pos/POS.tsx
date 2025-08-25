import React, { useState, useEffect } from 'react';
import { productsAPI, customersAPI, transactionsAPI, ordersAPI, schemasAPI, Product, Customer, DynamicField, Order } from '../../services/api';
import { printOrderReceipt } from '../../utils/printReceipt';
import DynamicForm from '../common/DynamicForm';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import CustomerLookup from './CustomerLookup';
import {
  MagnifyingGlassIcon,
  UserIcon,
  CreditCardIcon,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'coffee' | 'food'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  // Order metadata schema and values
  const [orderSchema, setOrderSchema] = useState<DynamicField[]>([]);
  const [orderMetadata, setOrderMetadata] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchProducts();
    // Load order schema for current user
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    (async () => {
      if (!user) return;
      try {
        const s = await schemasAPI.get(user.id, 'order');
        setOrderSchema(s.schema || []);
      } catch {}
    })();
  }, [categoryFilter]);

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
    const cartItemId = `${product.id}_${Date.now()}`;
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

    const cartItem: CartItem = {
      id: cartItemId,
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      customizations,
      totalPrice,
    };

    setCartItems(prev => [...prev, cartItem]);
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, quantity, totalPrice: item.price * quantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
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

      const statusValue: 'paid' | 'unpaid' = paymentData.paymentMethod === 'cash'
        ? 'paid'
        : (paymentData.status === 'paid' ? 'paid' : 'unpaid');

      // Resolve customer from selection only
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

      // Always create an order record
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

      // Auto-print receipt
      printOrderReceipt(createdOrder, { paymentMethod: paymentData.paymentMethod, status: statusValue, customer: selectedCustomer });

      // Update customer loyalty points if customer is selected
      if (customerIdToUse && transaction.loyaltyPointsEarned > 0) {
        await customersAPI.updatePoints(
          customerIdToUse,
          transaction.loyaltyPointsEarned,
          'add'
        );
      }

      // Deduct used loyalty points
      if (customerIdToUse && paymentData.loyaltyPointsUsed && transaction.status === 'paid') {
        await customersAPI.updatePoints(
          customerIdToUse,
          paymentData.loyaltyPointsUsed,
          'subtract'
        );
      }

      clearCart();
      setOrderMetadata({});
      setShowPaymentModal(false);
      alert('Payment successful!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="flex h-full space-x-6">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">POS Terminal</h1>
          
          {/* Category Filter */}
          <div className="flex space-x-2">
            {['all', 'coffee', 'food'].map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  categoryFilter === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={filteredProducts}
            onAddToCart={addToCart}
            loading={loading}
          />
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col space-y-4">
        {/* Customer Section */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Customer</h3>
            <button
              onClick={() => setShowCustomerLookup(true)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <UserIcon className="h-5 w-5" />
            </button>
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">{selectedCustomer.name}</p>
                <p className="text-sm text-green-700">{selectedCustomer.phone}</p>
                <p className="text-sm text-green-700">Points: {selectedCustomer.loyaltyPoints}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-3">No customer selected</p>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 card p-4">
          <Cart
            items={cartItems}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeFromCart}
            onClear={clearCart}
          />
        </div>

        {/* Order custom fields */}
        {orderSchema.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
            <DynamicForm schema={orderSchema} values={orderMetadata} onChange={setOrderMetadata} />
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={cartItems.length === 0}
          className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <CreditCardIcon className="h-6 w-6" />
          <span>Process Payment (${getCartTotal().toFixed(2)})</span>
        </button>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPayment={handlePayment}
          total={getCartTotal()}
          customer={selectedCustomer}
        />
      )}

      {showCustomerLookup && (
        <CustomerLookup
          isOpen={showCustomerLookup}
          onClose={() => setShowCustomerLookup(false)}
          onSelectCustomer={setSelectedCustomer}
        />
      )}
    </div>
  );
};

export default POS;