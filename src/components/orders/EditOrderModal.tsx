import React, { useState } from 'react';
import { Order, DynamicField } from '../../services/api';
import NumberInput from '../common/NumberInput';
import { Product, productsAPI } from '../../services/api';
import ProductCustomizationModal from '../pos/ProductCustomizationModal';

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
    notes: order.notes || '',
    paymentStatus: order.paymentStatus || 'unpaid',
    paymentMethod: order.paymentMethod || '',
    total: order.total,
    items: order.items,
    metadata: order.metadata || {}
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);

  React.useEffect(() => {
    (async () => {
      try { setProducts(await productsAPI.getAll()); } catch {}
    })();
  }, []);

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

  const addProductToOrder = (product: Product, customizations?: any) => {
    // Compute price including dynamic deltas similar to POS
    let unitPrice = product.price;
    const schema: any[] = Array.isArray((product as any).optionSchema) ? (product as any).optionSchema : [];
    schema.forEach(group => {
      const applied = customizations?.[group.key];
      if (group.type === 'single' && applied) {
        const value = (applied?.value ?? applied) as string;
        const opt = (group.options || []).find((o: any) => o.value === value);
        if (opt) unitPrice += Number(opt.priceDelta || 0);
      } else if (group.type === 'multi' && Array.isArray(applied)) {
        applied.forEach((v: any) => {
          const value = (v?.value ?? v) as string;
          const opt = (group.options || []).find((o: any) => o.value === value);
          if (opt) unitPrice += Number(opt.priceDelta || 0);
        });
      }
    });

    const nextItems = [
      ...formData.items,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: unitPrice,
        customizations,
      },
    ];
    const newTotal = nextItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    setFormData(prev => ({ ...prev, items: nextItems, total: newTotal }));
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
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => updateItem(index, 'quantity', value || 1)}
                        min={1}
                        className="input-field"
                        allowDecimals={false}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                      <NumberInput
                        value={item.price}
                        onChange={(value) => updateItem(index, 'price', value || 0)}
                        min={0}
                        step={0.01}
                        className="input-field"
                        allowDecimals={true}
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
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowPicker(v => !v)}
                  className="btn-outline text-sm"
                >
                  Add Product
                </button>
              </div>
              {showPicker && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-auto">
                  {products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProduct(p); setShowCustomize(true); }}
                      className="p-2 border rounded text-left hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">${p.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              )}
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
// Inject customization modal when adding products