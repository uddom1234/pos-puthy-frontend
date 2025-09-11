import React, { useState } from 'react';
import { Order, DynamicField } from '../../services/api';

interface EditOrderModalProps {
  order: Order;
  orderSchema: DynamicField[];
  onSave: (updatedOrder: Partial<Order>) => void;
  onCancel: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  orderSchema,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    tableNumber: order.tableNumber || '',
    notes: order.notes || '',
    paymentStatus: order.paymentStatus || 'unpaid',
    paymentMethod: order.paymentMethod || '',
    total: order.total,
    items: order.items,
    metadata: order.metadata || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedData = {
      ...formData,
      paymentMethod: formData.paymentMethod === '' ? undefined : formData.paymentMethod as 'cash' | 'qr'
    };
    onSave(sanitizedData);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setFormData(prev => ({ 
      ...prev, 
      items: updatedItems,
      total: newTotal
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setFormData(prev => ({ 
      ...prev, 
      items: updatedItems,
      total: newTotal
    }));
  };

  const updateMetadata = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value }
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Order #{order.id.slice(-8)}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Table Number</label>
              <input
                type="text"
                value={formData.tableNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                className="input-field"
                placeholder="Table number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as 'unpaid' | 'paid' }))}
                className="input-field"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            
            {formData.paymentStatus !== 'unpaid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentMethod: e.target.value === '' ? '' : e.target.value as 'cash' | 'qr'
                  }))}
                  className="input-field"
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="qr">QR Code</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Order notes..."
            />
          </div>

          {/* Custom Fields */}
          {orderSchema.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Custom Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderSchema.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData.metadata[field.key] || ''}
                        onChange={(e) => updateMetadata(field.key, e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={!!formData.metadata[field.key]}
                        onChange={(e) => updateMetadata(field.key, e.target.checked.toString())}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData.metadata[field.key] || ''}
                        onChange={(e) => updateMetadata(field.key, e.target.value)}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Order Items</h3>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                Total: ${formData.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrderModal;