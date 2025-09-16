import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { productsAPI, Product, schemasAPI, DynamicField, categoriesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PlusIcon, PencilIcon, ExclamationTriangleIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import OptionSchemaBuilder, { OptionField } from './OptionSchemaBuilder';
import NumberInput from '../common/NumberInput';
import ImageUploader from '../common/ImageUploader';
import ImagePreview from '../common/ImagePreview';
import CategoriesModal from './CategoriesModal';
import { TableSkeleton, FilterSkeleton } from '../common/SkeletonLoader';

const Inventory: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productSchema, setProductSchema] = useState<DynamicField[]>([]);
  const [categories, setCategories] = useState<string[]>(['coffee', 'food']);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [ordersWithProduct, setOrdersWithProduct] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [referencedProducts, setReferencedProducts] = useState<string[]>([]);

  const refreshCategories = useCallback(async () => {
    try {
      const cats = await categoriesAPI.list();
      if (Array.isArray(cats) && cats.length) setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

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
        const s = await schemasAPI.get('product');
        setProductSchema(s.schema || []);
      } catch {}
      try {
        const cats = await categoriesAPI.list();
        if (Array.isArray(cats) && cats.length) setCategories(cats);
      } catch {}
    };
    loadSchema();
  }, [user]);

  // Sync categories with products when products change
  useEffect(() => {
    if (products.length > 0) {
      const productCategories = Array.from(new Set(products.map(p => p.category)));
      const allCategories = Array.from(new Set([...categories, ...productCategories]));
      if (allCategories.length !== categories.length) {
        setCategories(allCategories);
      }
    }
  }, [products, categories]);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, 'Product name must be at least 2 characters')
      .max(100, 'Product name must be less than 100 characters')
      .required('Product name is required'),
    category: Yup.string()
      .required('Category is required'),
    price: Yup.number()
      .min(0, 'Price must be 0 or greater')
      .required('Price is required'),
    stock: Yup.number()
      .min(0, 'Stock must be 0 or greater')
      .when('hasStock', {
        is: true,
        then: (schema) => schema.required('Stock is required when stock management is enabled'),
        otherwise: (schema) => schema.notRequired()
      }),
    hasStock: Yup.boolean(),
    lowStockThreshold: Yup.number()
      .min(0, 'Low stock threshold must be 0 or greater')
      .when('hasStock', {
        is: true,
        then: (schema) => schema.required('Low stock threshold is required when stock management is enabled'),
        otherwise: (schema) => schema.notRequired()
      }),
    description: Yup.string()
      .max(500, 'Description must be less than 500 characters'),
    metadata: Yup.object(),
    optionSchema: Yup.array()
  });

  const ProductForm: React.FC<{
    product?: Product;
    onSave: (product: any) => void;
    onCancel: () => void;
  }> = ({ product, onSave, onCancel }) => {
    const initialValues = {
      name: product?.name || '',
      category: product?.category || 'coffee',
      price: product?.price || 0,
      stock: product?.stock || 0,
      hasStock: product?.hasStock !== undefined ? product.hasStock : true,
      lowStockThreshold: product?.lowStockThreshold || 10,
      description: product?.description || '',
      imageUrl: (product as any)?.imageUrl || '',
      metadata: (product as any)?.metadata || {},
      optionSchema: ((product as any)?.optionSchema || []) as OptionField[],
    };

    // Load hidden core fields from schemasAPI (saved under productCore)
    const [hiddenCore, setHiddenCore] = useState<string[]>([]);
    React.useEffect(() => {
      (async () => {
        try {
          if (!user?.id) return;
          const core = await schemasAPI.get('productCore' as any);
          const list = (core as any)?.schema || [];
          if (Array.isArray(list)) setHiddenCore(list);
        } catch {}
      })();
    }, [user?.id]);

    return (
      <div className="modal-overlay">
        <div className="modal-content max-w-4xl w-full flex flex-col bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {product ? 'Update product details and settings' : 'Create a new product for your inventory'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Formik Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              onSave(values);
              setSubmitting(false);
            }}
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => (
              <Form id="product-form" className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('basic_information')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!hiddenCore.includes('name') && <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('product_name')} *</label>
                    <Field
                      type="text"
                      name="name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                        errors.name && touched.name ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter product name"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                  </div>}
                  
                  {!hiddenCore.includes('category') && <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('category')} *</label>
                    <Field
                      as="select"
                      name="category"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                        errors.category && touched.category ? 'border-red-500' : ''
                      }`}
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="category" component="div" className="text-red-500 text-sm mt-1" />
                  </div>}
                </div>
              </div>
            
              {/* Pricing Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Pricing
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!hiddenCore.includes('price') && <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('price')} ($) *</label>
                    <Field name="price">
                      {({ field, meta }: { field: any; meta: any }) => (
                        <NumberInput
                          value={field.value || null}
                          onChange={(value) => setFieldValue('price', value || 0)}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          allowDecimals={true}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                            meta.error && meta.touched ? 'border-red-500' : ''
                          }`}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="price" component="div" className="text-red-500 text-sm mt-1" />
                  </div>}

                  {!hiddenCore.includes('priceKhr') && <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (៛) *</label>
                    <Field name="priceKhr">
                      {({ field, meta }: { field: any; meta: any }) => (
                        <NumberInput
                          value={field.value || null}
                          onChange={(value) => setFieldValue('priceKhr', value || 0)}
                          placeholder="0"
                          min={0}
                          step={100}
                          allowDecimals={false}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                            meta.error && meta.touched ? 'border-red-500' : ''
                          }`}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="priceKhr" component="div" className="text-red-500 text-sm mt-1" />
                  </div>}
                </div>
              </div>

              {/* Stock Management Section - Admin only */}
              {isAdmin && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Stock Management
                  </h3>
                
                {/* Stock Management Toggle - Admin only */}
                {isAdmin ? (
                  <div className="flex items-start space-x-4 p-4 bg-white border dark:border-gray-700 dark:bg-gray-800 border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="hasStock"
                      checked={values.hasStock}
                      onChange={(e) => setFieldValue('hasStock', e.target.checked)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <label htmlFor="hasStock" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Enable Stock Management
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        {values.hasStock ? 'Stock will be tracked and deducted on sales' : 'Made-to-order item (no stock tracking)'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Stock management is restricted to admin users only
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Stock Input - Only show when hasStock is enabled and user is admin */}
                {values.hasStock && !hiddenCore.includes('stock') && isAdmin && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('stock')} *</label>
                      <Field name="stock">
                        {({ field, meta }: { field: any; meta: any }) => (
                          <NumberInput
                            value={field.value || null}
                            onChange={(value) => setFieldValue('stock', value || 0)}
                            placeholder="0"
                            min={0}
                            allowDecimals={false}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                              meta.error && meta.touched ? 'border-red-500' : ''
                            }`}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="stock" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('low_stock_threshold_label')} *</label>
                      <Field name="lowStockThreshold">
                        {({ field, meta }: { field: any; meta: any }) => (
                          <NumberInput
                            value={field.value || null}
                            onChange={(value) => setFieldValue('lowStockThreshold', value || 0)}
                            placeholder="10"
                            min={0}
                            allowDecimals={false}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                              meta.error && meta.touched ? 'border-red-500' : ''
                            }`}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="lowStockThreshold" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                )}
                </div>
              )}
            
              {/* Description Section */}
              {!hiddenCore.includes('description') && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Description
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('product_description')}</label>
                    <Field
                      as="textarea"
                      name="description"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                        errors.description && touched.description ? 'border-red-500' : ''
                      }`}
                      rows={4}
                      placeholder="Enter product description (optional)"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              )}

              {/* Image Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4a2 2 0 013 0l4 4m1-1l1-1m-4-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('product_image')}
                </h3>
                <ImageUploader
                  value={(values as any).imageUrl}
                  onChange={(url) => setFieldValue('imageUrl', url || '')}
                />
              </div>

                  {/* Dynamic fields */}
                  {productSchema.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Custom Fields
                      </h3>
                      <div className="space-y-4">
                        {productSchema.map((f) => (
                          <div key={f.key}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{f.label}</label>
                            {f.type === 'text' || f.type === 'number' ? (
                              <input
                                type={f.type}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={values.metadata?.[f.key] ?? ''}
                                onChange={(e) => setFieldValue('metadata', { ...(values.metadata||{}), [f.key]: f.type==='number'? Number(e.target.value): e.target.value })}
                              />
                            ) : f.type === 'date' ? (
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={values.metadata?.[f.key] ?? ''}
                                onChange={(e) => setFieldValue('metadata', { ...(values.metadata||{}), [f.key]: e.target.value })}
                              />
                            ) : f.type === 'select' ? (
                              <select
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={values.metadata?.[f.key] ?? ''}
                                onChange={(e) => setFieldValue('metadata', { ...(values.metadata||{}), [f.key]: e.target.value })}
                              >
                                <option value="">Select...</option>
                                {(f.options||[]).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  checked={!!values.metadata?.[f.key]}
                                  onChange={(e) => setFieldValue('metadata', { ...(values.metadata||{}), [f.key]: e.target.checked })}
                                />
                                <span className="text-sm text-gray-700">{f.label}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option schema builder */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Product Options
                    </h3>
                    <OptionSchemaBuilder
                      value={values.optionSchema}
                      onChange={(next) => setFieldValue('optionSchema', next)}
                    />
                  </div>
                </div>
              </Form>
            )}
          </Formik>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
              <button 
                type="button" 
                onClick={onCancel} 
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="product-form"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
              >
                {product ? t('edit_product_modal') : t('add_product_modal')}
              </button>
            </div>
          </div>
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

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      setIsBulkDeleting(true);
      setBulkDeleteError(null);
      setReferencedProducts([]);
      
      // First try regular delete
      try {
        await productsAPI.bulkDelete(selectedProducts, false);
        fetchProducts();
        setSelectedProducts([]);
        setShowBulkDeleteModal(false);
        alert(`${selectedProducts.length} products deleted successfully`);
      } catch (deleteError: any) {
        // If it fails due to transaction items, show force delete option
        if (deleteError?.response?.data?.hasTransactionItems) {
          setBulkDeleteError(deleteError.response.data.message);
          setReferencedProducts(deleteError.response.data.referencedProducts || []);
          return; // Don't reset loading state, show force delete option
        }
        throw deleteError;
      }
    } catch (error: any) {
      console.error('Error bulk deleting products:', error);
      alert('Failed to delete products');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleForceBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      setIsBulkDeleting(true);
      await productsAPI.bulkDelete(selectedProducts, true); // force delete
      fetchProducts();
      setSelectedProducts([]);
      setShowBulkDeleteModal(false);
      setBulkDeleteError(null);
      setReferencedProducts([]);
      alert(`${selectedProducts.length} products deleted successfully`);
    } catch (error) {
      console.error('Error force bulk deleting products:', error);
      alert('Failed to force delete products');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="h-8 w-64 skeleton-shimmer rounded"></div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
            <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
          </div>
        </div>
        
        <FilterSkeleton count={4} />
        
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('inventory')}</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {isAdmin && (
            <button
              onClick={() => {
                refreshCategories();
                setShowCategoriesModal(true);
              }}
              className="btn-outline flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <TagIcon className="h-5 w-5" />
              <span>{t('manage_categories')}</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('add_product')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {products.length > 0 && isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Select All ({selectedProducts.length}/{products.length})
              </span>
            </label>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProducts.length} selected
              </span>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={isBulkDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', ...categories].map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              categoryFilter === category
                ? 'bg-primary-600 dark:bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('price')} ($)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price (៛)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('stock')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status')}
                </th>
                {productSchema.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('custom')}
                  </th>
                )}
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id}>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ImagePreview
                      src={product.imageUrl || ''}
                      alt={product.name}
                      className="inline-block"
                    >
                      {product.imageUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-200 rounded-lg flex items-center justify-center">
                          <span className="text-lg">
                            {product.category === 'coffee' ? '☕' : '🍽️'}
                          </span>
                        </div>
                      )}
                    </ImagePreview>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{product.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.priceKhr ? `៛${product.priceKhr.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.hasStock ? product.stock : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.hasStock ? (
                      product.stock <= product.lowStockThreshold ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          {t('low_stock')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {t('in_stock')}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {t('made_to_order')}
                      </span>
                    )}
                  </td>
                  {productSchema.length > 0 && (
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="grid grid-cols-1 gap-1">
                        {productSchema.map((f) => (
                          <div key={f.key} className="text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{f.label}: </span>
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
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 flex items-center space-x-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1 disabled:opacity-50"
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
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Product</h3>
            
            <div className="mb-6">
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ Warning: This product cannot be deleted!</p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The product "<strong>{productToDelete.name}</strong>" is referenced in transaction history and/or existing orders. 
                Deleting it will remove:
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
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
                        <span>${order.total.toFixed(2)}</span>
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Selected Products
            </h3>
            
            {!bulkDeleteError ? (
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete {selectedProducts.length} selected product{selectedProducts.length > 1 ? 's' : ''}? 
                  This action cannot be undone.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ Warning: Some products cannot be deleted!</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The following products are referenced in transaction history and/or existing orders:
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Referenced products:</h4>
                  <div className="space-y-1">
                    {referencedProducts.map((productName) => (
                      <div key={productName} className="text-sm text-yellow-700">
                        • {productName}
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-800 font-medium">
                  You can force delete all products, which will remove them and ALL related data including orders and transactions. 
                  Consider hiding the products instead if you want to keep historical records.
                </p>
              </div>
            )}
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setBulkDeleteError(null);
                  setReferencedProducts([]);
                }}
                disabled={isBulkDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              
              {!bulkDeleteError ? (
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isBulkDeleting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isBulkDeleting ? 'Deleting...' : `Delete ${selectedProducts.length} Products`}</span>
                </button>
              ) : (
                <button
                  onClick={handleForceBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isBulkDeleting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isBulkDeleting ? 'Force Deleting...' : 'Yes, Delete Everything'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      <CategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        onCategoriesChange={setCategories}
      />
    </div>
  );
};

export default Inventory;