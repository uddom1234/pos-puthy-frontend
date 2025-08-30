import React, { useState, useEffect } from 'react';
import { ordersAPI, Order, schemasAPI, DynamicField } from '../../services/api';
import { ClockIcon, CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { printOrderReceipt } from '../../utils/printReceipt';
import PaymentProcessingModal from '../pos/PaymentProcessingModal';
import EditOrderModal from './EditOrderModal';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSchema, setOrderSchema] = useState<DynamicField[]>([]);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
    // Load schema for current user (mock: read from localStorage user)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    (async () => {
      if (!user) return;
      try {
        const s = await schemasAPI.get(user.id, 'order');
        setOrderSchema(s.schema || []);
      } catch {}
    })();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus'], paymentMethod?: Order['paymentMethod']) => {
    try {
      await ordersAPI.updatePayment(orderId, paymentStatus, paymentMethod);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, paymentStatus, paymentMethod } : order
        )
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handlePaymentComplete = async (paymentMethod: 'cash' | 'qr', discount?: number, cashReceived?: number) => {
    if (!selectedOrderForPayment) return;
    
    try {
      await ordersAPI.updatePayment(selectedOrderForPayment.id, 'paid', paymentMethod, discount, cashReceived);
      setOrders(prev => 
        prev.map(order => 
          order.id === selectedOrderForPayment.id ? { ...order, paymentStatus: 'paid', paymentMethod } : order
        )
      );
      setSelectedOrderForPayment(null);
      // Optionally update order status to completed if it's ready
      if (selectedOrderForPayment.status === 'ready') {
        await updateOrderStatus(selectedOrderForPayment.id, 'completed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const handleEditOrder = async (updatedOrder: Partial<Order>) => {
    if (!selectedOrderForEdit) return;
    
    try {
      await ordersAPI.update(selectedOrderForEdit.id, updatedOrder);
      setOrders(prev => 
        prev.map(order => 
          order.id === selectedOrderForEdit.id ? { ...order, ...updatedOrder } : order
        )
      );
      setSelectedOrderForEdit(null);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      setIsDeleting(true);
      await ordersAPI.delete(orderToDelete.id);
      setOrders(prev => prev.filter(order => order.id !== orderToDelete.id));
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: Order['paymentStatus']) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
      case 'preparing':
        return <ClockIcon className="h-4 w-4" />;
      case 'ready':
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} active orders
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id.slice(-8)}</h3>
                  <p className="text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.tableNumber && (
                    <p className="text-sm text-gray-500">Table: {order.tableNumber}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex flex-col space-y-1 items-end">
                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      {order.paymentMethod && ` (${order.paymentMethod.toUpperCase()})`}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${order.total.toFixed(2)}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => printOrderReceipt(order)}
                      className="btn-outline text-sm"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => setSelectedOrderForEdit(order)}
                      className="btn-outline text-sm flex items-center space-x-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setOrderToDelete(order)}
                      className="px-3 py-1 border border-red-300 text-red-700 rounded text-sm hover:bg-red-50 flex items-center space-x-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {orderSchema.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {orderSchema.map((f) => (
                    <div key={f.key} className="text-sm text-gray-700">
                      <span className="font-medium">{f.label}: </span>
                      <span>{String((order as any).metadata?.[f.key] ?? '')}</span>
                    </div>
                  ))}
                </div>
              )}

              {order.notes && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {order.notes}
                  </p>
                </div>
              )}

              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="space-y-3">
                  {/* Order Status Controls */}
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="btn-primary text-sm"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="btn-secondary text-sm"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="btn-primary text-sm"
                      >
                        Complete Order
                      </button>
                    )}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="px-3 py-1 border border-red-300 text-red-700 rounded text-sm hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Payment Controls */}
                  {order.paymentStatus !== 'paid' && (
                    <div className="flex space-x-2 pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600 self-center">Payment:</span>
                      <button
                        onClick={() => setSelectedOrderForPayment(order)}
                        className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Process Payment</span>
                      </button>
                      {order.paymentStatus === 'unpaid' && (
                        <button
                          onClick={() => updatePaymentStatus(order.id, 'partial')}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          Partial Payment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Processing Modal */}
      {selectedOrderForPayment && (
        <PaymentProcessingModal
          order={selectedOrderForPayment}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setSelectedOrderForPayment(null)}
        />
      )}

      {/* Edit Order Modal */}
      {selectedOrderForEdit && (
        <EditOrderModal
          order={selectedOrderForEdit}
          orderSchema={orderSchema}
          onSave={handleEditOrder}
          onCancel={() => setSelectedOrderForEdit(null)}
        />
      )}

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="modal-overlay">
          <div className="modal-content p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Order</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete order #{orderToDelete.id} for Table {orderToDelete.tableNumber}? 
              This action cannot be undone and will remove all associated transactions and payment records.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isDeleting ? 'Deleting...' : 'Delete Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;