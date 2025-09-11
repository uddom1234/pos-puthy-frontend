import React, { useState, useEffect } from 'react';
import { expenseCategoriesAPI, ExpenseCategory } from '../../services/api';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange: (categories: ExpenseCategory[]) => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChange
}) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
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
      const data = await expenseCategoriesAPI.getAll();
      setCategories(data);
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
      const newCategory = await expenseCategoriesAPI.create({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        isActive: true
      });
      
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      onCategoriesChange(updatedCategories);
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: ExpenseCategory) => {
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
      const updatedCategory = await expenseCategoriesAPI.update(editingCategory.id, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        isActive: editingCategory.isActive
      });
      
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      );
      setCategories(updatedCategories);
      onCategoriesChange(updatedCategories);
      
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
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await expenseCategoriesAPI.delete(categoryId);
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      setCategories(updatedCategories);
      onCategoriesChange(updatedCategories);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: ExpenseCategory) => {
    try {
      const updatedCategory = await expenseCategoriesAPI.update(category.id, {
        isActive: !category.isActive
      });
      
      const updatedCategories = categories.map(cat => 
        cat.id === category.id ? updatedCategory : cat
      );
      setCategories(updatedCategories);
      onCategoriesChange(updatedCategories);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryColor('#3B82F6');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full mx-4 max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TagIcon className="h-6 w-6 mr-2" />
            Manage Expense Categories
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Add/Edit Category Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
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
                  placeholder="Enter category name"
                  className="input-field"
                  disabled={loading}
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
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex space-x-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-6 h-6 rounded border-2 ${
                          newCategoryColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Enter category description"
                className="input-field"
                rows={2}
                disabled={loading}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                disabled={!newCategoryName.trim() || loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{editingCategory ? 'Update' : 'Add'} Category</span>
              </button>
              {editingCategory && (
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="btn-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Existing Categories ({categories.length})
            </h3>
            
            {loading && categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No categories found. Add your first category above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      category.isActive 
                        ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </span>
                          {!category.isActive && (
                            <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(category)}
                        disabled={loading}
                        className={`px-2 py-1 text-xs rounded ${
                          category.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        title="Edit category"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="Delete category"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="btn-outline"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementModal;
