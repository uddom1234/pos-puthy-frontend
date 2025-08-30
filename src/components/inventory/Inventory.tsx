import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, Product, schemasAPI, DynamicField, categoriesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, PencilIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import OptionSchemaBuilder, { OptionField } from './OptionSchemaBuilder';
import NumberInput from '../common/NumberInput';

const Inventory: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'coffee' | 'food'>('all');
  const [productSchema, setProductSchema] = useState<DynamicField[]>([]);
  const [categories, setCategories] = useState<string[]>(['coffee', 'food']);
  const [newCategory, setNewCategory] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [ordersWithProduct, setOrdersWithProduct] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll(categoryFilter === 'all' ? undefined : categoryFilter);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // load schema
    const loadSchema = async () => {
      if (!user?.id) return;
      try {
        const s = await schemasAPI.get(user.id, 'product');
        setProductSchema(s.schema || []);
      } catch {}
      try {
        const cats = await categoriesAPI.list();
        if (Array.isArray(cats) && cats.length) setCategories(cats);
      } catch {}
    };
    loadSchema();
  }, [user]);

  const ProductForm: React.FC<{
    product?: Product;
    onSave: (product: any) => void;
    onCancel: () => void;
  }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      category: product?.category || 'coffee',
      price: product?.price || 0,
      stock: product?.stock || 0,
      lowStockThreshold: product?.lowStockThreshold || 10,
      description: product?.description || '',
      metadata: (product as any)?.metadata || {},
      optionSchema: ((product as any)?.optionSchema || []) as OptionField[],
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    // Load hidden core fields from schemasAPI (saved under productCore)
    const [hiddenCore, setHiddenCore] = useState<string[]>([]);
    React.useEffect(() => {
      (async () => {
        try {
          if (!user?.id) return;
          const core = await schemasAPI.get(user.id, 'productCore' as any);
          const list = (core as any)?.schema || [];
          if (Array.isArray(list)) setHiddenCore(list);
        } catch {}
      })();
    }, [user?.id]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full mx-2 sm:mx-4 max-w-3xl md:max-w-4xl">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-xl font-semibold">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {!hiddenCore.includes('name') && <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>}
            
            {!hiddenCore.includes('category') && <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="input-field"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!hiddenCore.includes('price') && <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <NumberInput
                  value={formData.price || null}
                  onChange={(value) => setFormData(prev => ({ ...prev, price: value || 0 }))}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  allowDecimals={true}
                  required
                />
              </div>}
              {!hiddenCore.includes('stock') && <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <NumberInput
                  value={formData.stock || null}
                  onChange={(value) => setFormData(prev => ({ ...prev, stock: value || 0 }))}
                  placeholder="0"
                  min={0}
                  allowDecimals={false}
                  required
                />
              </div>}
            </div>
            
            {!hiddenCore.includes('lowStockThreshold') && <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <NumberInput
                value={formData.lowStockThreshold || null}
                onChange={(value) => setFormData(prev => ({ ...prev, lowStockThreshold: value || 0 }))}
                placeholder="10"
                min={0}
                allowDecimals={false}
                required
              />
            </div>}
            
            {!hiddenCore.includes('description') && <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                rows={4}
              />
            </div>}
            
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 btn-outline">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                {product ? 'Update' : 'Add'} Product
              </button>
            </div>
          {/* Dynamic fields */}
          {productSchema.length > 0 && (
            <div className="p-6 pt-0 space-y-4">
              <h3 className="text-md font-semibold">Custom Fields</h3>
              {productSchema.map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === 'text' || f.type === 'number' ? (
                    <input
                      type={f.type}
                      className="input-field"
                      value={formData.metadata?.[f.key] ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...(prev.metadata||{}), [f.key]: f.type==='number'? Number(e.target.value): e.target.value } }))}
                    />
                  ) : f.type === 'date' ? (
                    <input
                      type="date"
                      className="input-field"
                      value={formData.metadata?.[f.key] ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...(prev.metadata||{}), [f.key]: e.target.value } }))}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      className="input-field"
                      value={formData.metadata?.[f.key] ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...(prev.metadata||{}), [f.key]: e.target.value } }))}
                    >
                      <option value="">Select...</option>
                      {(f.options||[]).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!formData.metadata?.[f.key]}
                        onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...(prev.metadata||{}), [f.key]: e.target.checked } }))}
                      />
                      <span className="text-sm text-gray-700">{f.label}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Option schema builder */}
          <div className="p-4 sm:p-6 pt-0 space-y-4">
            <OptionSchemaBuilder
              value={formData.optionSchema}
              onChange={(next) => setFormData(prev => ({ ...prev, optionSchema: next }))}
            />
          </div>

          </form>
        </div>
      </div>
    );
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData);
      } else {
        await productsAPI.create(productData);
      }
      fetchProducts();
      setShowAddModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      setIsDeleting(true);
      // First try a regular delete
      try {
        await productsAPI.delete(product.id);
        fetchProducts();
        return;
      } catch (deleteError: any) {
        // If it fails due to transaction items, check orders
        if (deleteError?.response?.data?.hasTransactionItems) {
          // Check if product is used in orders
          const orderCheck = await productsAPI.checkOrders(product.id);
          setProductToDelete(product);
          setOrdersWithProduct(orderCheck.orders || []);
          setShowDeleteModal(true);
          setIsDeleting(false); // Reset loading state when showing modal
          return;
        }
        throw deleteError;
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error deleting product');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleForceDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setIsDeleting(true);
      await productsAPI.delete(productToDelete.id, true); // force delete
      fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      setOrdersWithProduct([]);
    } catch (error) {
      console.error('Error force deleting product:', error);
      alert('Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2">
        {['all', ...categories].map(category => (
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
        {isAdmin && (
          <div className="flex items-center space-x-2 ml-2">
            <input
              className="input-field"
              placeholder="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              className="btn-secondary"
              onClick={async () => {
                if (!newCategory.trim()) return;
                try {
                  const updated = await categoriesAPI.add(newCategory.trim());
                  setCategories(updated);
                  setNewCategory('');
                } catch {}
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {productSchema.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custom
                  </th>
                )}
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stock <= product.lowStockThreshold ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </td>
                  {productSchema.length > 0 && (
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="grid grid-cols-1 gap-1">
                        {productSchema.map((f) => (
                          <div key={f.key} className="text-xs">
                            <span className="text-gray-600">{f.label}: </span>
                            <span>{String((product as any).metadata?.[f.key] ?? '')}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                          <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <ProductForm
          onSave={handleSaveProduct}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {/* Delete Product Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Product</h3>
            
            <div className="mb-6">
              <p className="text-red-600 font-medium mb-2">⚠️ Warning: This product cannot be deleted!</p>
              <p className="text-gray-600 mb-4">
                The product "<strong>{productToDelete.name}</strong>" is referenced in transaction history and/or existing orders. 
                Deleting it will remove:
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• All transaction history for this product</li>
                  <li>• All sales records and analytics data</li>
                  {ordersWithProduct.length > 0 && <li>• {ordersWithProduct.length} existing order(s)</li>}
                  <li>• Product customization options</li>
                </ul>
              </div>
              
              {ordersWithProduct.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Orders that will be deleted:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ordersWithProduct.map((order) => (
                      <div key={order.id} className="text-sm text-yellow-700 flex justify-between">
                        <span>Order #{order.id} - Table {order.tableNumber}</span>
                        <span>${order.total.toFixed(2)} ({order.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-gray-800 font-medium">
                This action will permanently delete the product and ALL related data. 
                Consider hiding the product instead if you want to keep historical records.
              </p>
              
              <p className="text-red-600 font-medium mt-2">
                This action cannot be undone!
              </p>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                  setOrdersWithProduct([]);
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleForceDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;