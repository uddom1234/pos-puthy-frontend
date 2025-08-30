import React, { useState, useEffect, useCallback } from 'react';
import { incomeExpenseAPI, IncomeExpense } from '../../services/api';
import { PlusIcon, FunnelIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import NumberInput from '../common/NumberInput';

const IncomeExpensePage: React.FC = () => {
  const [entries, setEntries] = useState<IncomeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeExpense | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
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

  useEffect(() => {
    fetchEntries(true); // Initial load with loading state
  }, [fetchEntries]);

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
      alert('Failed to save entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      setIsDeleting(true);
      await incomeExpenseAPI.delete(id);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedEntries.size} selected entries?`)) return;
    
    try {
      setIsDeleting(true);
      await incomeExpenseAPI.bulkDelete(Array.from(selectedEntries));
      setSelectedEntries(new Set());
      fetchEntries();
    } catch (error) {
      console.error('Error bulk deleting entries:', error);
      alert('Failed to delete entries');
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
      income: ['Sales', 'Catering', 'Tips', 'Other Income'],
      expense: ['Inventory', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Equipment', 'Other Expense'],
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-md w-full mx-4">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Add New Entry</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Category</option>
                {categories[formData.type].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 btn-outline">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Add Entry
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Income & Expense Tracking</h1>
        <div className="flex space-x-3">
          <button onClick={() => fetchEntries(false)} className="btn-outline">Refresh</button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">${getTotalIncome().toFixed(2)}</p>
        </div>
        <div className="card p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">${getTotalExpenses().toFixed(2)}</p>
        </div>
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900">Net Profit</h3>
          <p className={`text-3xl font-bold ${getNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${getNetProfit().toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Filter by category"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedEntries.size} entries selected
            </p>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="btn-secondary bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEntries.size === entries.length && entries.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className={selectedEntries.has(entry.id) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => handleSelectEntry(entry.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default IncomeExpensePage;