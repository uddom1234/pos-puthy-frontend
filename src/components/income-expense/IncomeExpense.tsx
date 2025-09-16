import React, { useState, useEffect, useCallback } from 'react';
import { incomeExpenseAPI, IncomeExpense, incomeCategoriesAPI, IncomeCategory, expenseCategoriesAPI, ExpenseCategory } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCambodianTime } from '../../utils/timeUtils';
import { PlusIcon, FunnelIcon, PencilIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import NumberInput from '../common/NumberInput';
import UnifiedCategoryManagementModal from './UnifiedCategoryManagementModal';
import { TableSkeleton, CardSkeleton, FilterSkeleton } from '../common/SkeletonLoader';

const IncomeExpensePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<IncomeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeExpense | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '' as '' | 'income' | 'expense',
    category: '',
  });

  const fetchEntries = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await incomeExpenseAPI.getAll({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type || undefined,
        category: filters.category || undefined,
      });
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.type, filters.category]);

  const fetchCategories = useCallback(async () => {
    try {
      const [incomeData, expenseData] = await Promise.all([
        incomeCategoriesAPI.getAll(),
        expenseCategoriesAPI.getAll()
      ]);
      setIncomeCategories(incomeData);
      setExpenseCategories(expenseData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchEntries(true); // Initial load with loading state
    fetchCategories(); // Load categories
  }, [fetchEntries, fetchCategories]);

  const handleSaveEntry = async (entryData: any) => {
    try {
      if (editingEntry) {
        await incomeExpenseAPI.update(editingEntry.id, entryData);
      } else {
        await incomeExpenseAPI.create(entryData);
      }
      fetchEntries();
      setShowAddModal(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert(t('failed_to_save_entry'));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm(t('are_you_sure_delete_entry'))) return;
    
    try {
      setIsDeleting(true);
      await incomeExpenseAPI.delete(id);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(t('failed_to_delete_entry'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return;
    
    const selectedCount = selectedEntries.size;
    const selectedIds = Array.from(selectedEntries);
    
    if (!window.confirm(t('are_you_sure_delete_entries').replace('{count}', selectedCount.toString()))) return;
    
    try {
      setIsDeleting(true);
      console.log('Deleting entries:', selectedIds); // Debug log
      console.log('Selected IDs type:', typeof selectedIds[0]); // Check ID type
      console.log('Selected IDs length:', selectedIds.length);
      
      await incomeExpenseAPI.bulkDelete(selectedIds);
      
      // Clear selection and refresh data
      setSelectedEntries(new Set());
      await fetchEntries();
      
      // Show success message
      alert(t('successfully_deleted_entries').replace('{count}', selectedCount.toString()));
    } catch (error) {
      console.error('Error bulk deleting entries:', error);
      console.error('Error details:', error);
      
      // More detailed error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(t('failed_to_delete_entries').replace('{error}', errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(entry => entry.id)));
    }
  };

  const EntryModal: React.FC<{
    entry?: IncomeExpense | null;
    onSave: (entry: any) => void;
    onCancel: () => void;
  }> = ({ entry, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      type: (entry?.type || 'income') as 'income' | 'expense',
      category: entry?.category || '',
      description: entry?.description || '',
      amount: entry?.amount || null,
      date: entry?.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const categories = {
      income: incomeCategories.filter(cat => cat.isActive).map(cat => cat.name),
      expense: expenseCategories.filter(cat => cat.isActive).map(cat => cat.name),
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Find the category ID based on type
      let categoryId = undefined;
      if (formData.type === 'income') {
        const selectedCategory = incomeCategories.find(cat => cat.name === formData.category);
        categoryId = selectedCategory?.id;
      } else if (formData.type === 'expense') {
        const selectedCategory = expenseCategories.find(cat => cat.name === formData.category);
        categoryId = selectedCategory?.id;
      }
      
      onSave({
        ...formData,
        categoryId
      });
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('add_new_entry')}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as any,
                  category: '' // Reset category when type changes
                }))}
                className="input-field"
                required
              >
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">{t('select_category')}</option>
                {categories[formData.type].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount_dollar')}</label>
              <NumberInput
                value={formData.amount}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                placeholder="0.00"
                step={0.01}
                min={0}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="input-field dark:bg-gray-800"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 btn-outline">
                {t('cancel')}
              </button>
              <button type="submit" className="flex-1 btn-primary">
                {t('add_entry_button')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getTotalIncome = () => {
    return entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getTotalExpenses = () => {
    return entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getNetProfit = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 skeleton-shimmer rounded"></div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
            <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
            <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
          </div>
        </div>
        
        <CardSkeleton count={3} />
        
        <div className="card p-6">
          <div className="h-6 w-24 skeleton-shimmer rounded mb-4"></div>
          <FilterSkeleton count={4} />
        </div>
        
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('income_expense')}</h1>
        <div className="flex space-x-3">
          <button onClick={() => fetchEntries(false)} className="btn-outline">{t('refresh')}</button>
          {isAdmin && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn-outline flex items-center space-x-2"
            >
              <Cog6ToothIcon className="h-5 w-5" />
              <span>{t('manage_categories')}</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('add_entry')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('total_income')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">${getTotalIncome().toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">+{entries.filter(e => e.type === 'income').length} {t('entries')}</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{t('total_expenses')}</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">${getTotalExpenses().toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-red-600 dark:text-red-400 font-medium">+{entries.filter(e => e.type === 'expense').length} {t('entries')}</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('net_profit')}</p>
                <p className={`text-3xl font-bold ${getNetProfit() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${getNetProfit().toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${getNetProfit() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {getNetProfit() >= 0 ? t('profit') : t('loss')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{t('filters')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('start_date')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('end_date')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type')}</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="input-field"
            >
              <option value="">{t('all_types')}</option>
              <option value="income">{t('income')}</option>
              <option value="expense">{t('expense')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              placeholder={t('filter_by_category')}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && isAdmin && (
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 shadow-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full">
                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  {selectedEntries.size} {selectedEntries.size === 1 ? t('entry') : t('entries')} {t('selected')}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {t('this_action_cannot_be_undone')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedEntries(new Set())}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{t('deleting')}</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    <span>{t('delete_selected')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEntries.size === entries.length && entries.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  {t('amount')}
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className={`group hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedEntries.has(entry.id) 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                      : ''
                  } ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}
                >
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCambodianTime(entry.date, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        entry.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.category}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${
                      entry.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t('edit_entry')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('delete_entry')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {entries.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('no_entries_found')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filters.startDate || filters.endDate || filters.type || filters.category
                ? t('try_adjusting_filters')
                : t('get_started_adding_entry')
              }
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <PlusIcon className="h-5 w-5" />
                <span>{t('add')} {t('entry')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Entry Modal */}
      {(showAddModal || editingEntry) && (
        <EntryModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Category Management Modal */}
      <UnifiedCategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onIncomeCategoriesChange={setIncomeCategories}
        onExpenseCategoriesChange={setExpenseCategories}
      />
    </div>
  );
};

export default IncomeExpensePage;