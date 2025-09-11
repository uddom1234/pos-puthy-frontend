import React, { useState, useEffect } from 'react';
import { incomeCategoriesAPI, IncomeCategory, expenseCategoriesAPI, ExpenseCategory } from '../../services/api';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';

interface UnifiedCategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncomeCategoriesChange: (categories: IncomeCategory[]) => void;
  onExpenseCategoriesChange: (categories: ExpenseCategory[]) => void;
}

const UnifiedCategoryManagementModal: React.FC<UnifiedCategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onIncomeCategoriesChange,
  onExpenseCategoriesChange
}) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<IncomeCategory | ExpenseCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
      setEditingCategory(null);
      setError('');
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [incomeData, expenseData] = await Promise.all([
        incomeCategoriesAPI.getAll(),
        expenseCategoriesAPI.getAll()
      ]);
      setIncomeCategories(incomeData);
      setExpenseCategories(expenseData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'income') {
        const newCategory = await incomeCategoriesAPI.create({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor,
          isActive: true
        });
        
        const updatedCategories = [...incomeCategories, newCategory];
        setIncomeCategories(updatedCategories);
        onIncomeCategoriesChange(updatedCategories);
      } else {
        const newCategory = await expenseCategoriesAPI.create({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor,
          isActive: true
        });
        
        const updatedCategories = [...expenseCategories, newCategory];
        setExpenseCategories(updatedCategories);
        onExpenseCategoriesChange(updatedCategories);
      }
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: IncomeCategory | ExpenseCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
    setNewCategoryColor(category.color);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'income') {
        const updatedCategory = await incomeCategoriesAPI.update(editingCategory.id, {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor,
          isActive: true
        });
        
        const updatedCategories = incomeCategories.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        );
        setIncomeCategories(updatedCategories);
        onIncomeCategoriesChange(updatedCategories);
      } else {
        const updatedCategory = await expenseCategoriesAPI.update(editingCategory.id, {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor,
          isActive: true
        });
        
        const updatedCategories = expenseCategories.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        );
        setExpenseCategories(updatedCategories);
        onExpenseCategoriesChange(updatedCategories);
      }
      
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'income') {
        await incomeCategoriesAPI.delete(categoryId);
        const updatedCategories = incomeCategories.filter(cat => cat.id !== categoryId);
        setIncomeCategories(updatedCategories);
        onIncomeCategoriesChange(updatedCategories);
      } else {
        await expenseCategoriesAPI.delete(categoryId);
        const updatedCategories = expenseCategories.filter(cat => cat.id !== categoryId);
        setExpenseCategories(updatedCategories);
        onExpenseCategoriesChange(updatedCategories);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryColor('#3B82F6');
  };

  const currentCategories = activeTab === 'income' ? incomeCategories : expenseCategories;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'income'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Income Categories
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'expense'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Expense Categories
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Add/Edit Category Form */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="input-field"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <div className="flex space-x-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Enter category description"
              />
            </div>
            <div className="mt-4 flex space-x-2">
              {editingCategory ? (
                <>
                  <button
                    onClick={handleUpdateCategory}
                    disabled={loading || !newCategoryName.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Category'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddCategory}
                  disabled={loading || !newCategoryName.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Category'}
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {activeTab === 'income' ? 'Income' : 'Expense'} Categories
            </h3>
            {loading && currentCategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading categories...</p>
              </div>
            ) : currentCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <TagIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No {activeTab} categories found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCategoryManagementModal;
