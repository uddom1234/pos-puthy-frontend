import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesChange
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewCategoryName('');
      setEditingCategory(null);
      setError('');
    }
  }, [isOpen]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const updatedCategories = await categoriesAPI.add(newCategoryName.trim());
      onCategoriesChange(updatedCategories);
      setNewCategoryName('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setNewCategoryName(oldName);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // First remove the old category
      await categoriesAPI.remove(editingCategory);
      // Then add the new one
      const updatedCategories = await categoriesAPI.add(newCategoryName.trim());
      onCategoriesChange(updatedCategories);
      setEditingCategory(null);
      setNewCategoryName('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const updatedCategories = await categoriesAPI.remove(categoryName);
      onCategoriesChange(updatedCategories);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Categories
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
            
            <div className="flex space-x-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 input-field"
                disabled={loading}
              />
              <button
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                disabled={!newCategoryName.trim() || loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{editingCategory ? 'Update' : 'Add'}</span>
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
            
            {categories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No categories found. Add your first category above.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">
                      {category}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        title="Edit category"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
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

export default CategoriesModal;
