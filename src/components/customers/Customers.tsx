import React, { useState, useEffect } from 'react';
import { customersAPI, Customer } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { PlusIcon, MagnifyingGlassIcon, GiftIcon } from '@heroicons/react/24/outline';
import { TableSkeleton, CardSkeleton } from '../common/SkeletonLoader';
import NumberInput from '../common/NumberInput';

const Customers: React.FC = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersAPI.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.memberCard && customer.memberCard.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const AddCustomerModal: React.FC<{
    onSave: (customer: any) => void;
    onCancel: () => void;
  }> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      memberCard: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Customer</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
                placeholder="+1234567890"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Member Card (Optional)</label>
              <input
                type="text"
                value={formData.memberCard}
                onChange={(e) => setFormData(prev => ({ ...prev, memberCard: e.target.value }))}
                className="input-field"
                placeholder="MEMBER001"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 btn-outline">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Add Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ManagePointsModal: React.FC<{
    customer: Customer;
    onSave: (points: number, operation: 'add' | 'subtract') => void;
    onCancel: () => void;
  }> = ({ customer, onSave, onCancel }) => {
    const [points, setPoints] = useState(0);
    const [operation, setOperation] = useState<'add' | 'subtract'>('add');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(points, operation);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Loyalty Points</h2>
            <p className="text-gray-600 dark:text-gray-400">{customer.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Points: {customer.loyaltyPoints}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operation</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as any)}
                className="input-field"
              >
                <option value="add">Add Points</option>
                <option value="subtract">Subtract Points</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
              <NumberInput
                value={points}
                onChange={(value) => setPoints(value || 0)}
                min={0}
                max={operation === 'subtract' ? customer.loyaltyPoints : undefined}
                className="input-field"
                allowDecimals={false}
                required
              />
            </div>

            {operation === 'subtract' && points > customer.loyaltyPoints && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                Cannot subtract more points than available ({customer.loyaltyPoints})
              </p>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Preview:</strong> {customer.loyaltyPoints} {operation === 'add' ? '+' : '-'} {points} = {' '}
                <span className="font-semibold">
                  {operation === 'add' 
                    ? customer.loyaltyPoints + points 
                    : Math.max(0, customer.loyaltyPoints - points)
                  } points
                </span>
              </p>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 btn-outline">
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 btn-primary"
                disabled={operation === 'subtract' && points > customer.loyaltyPoints}
              >
                Update Points
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleSaveCustomer = async (customerData: any) => {
    try {
      await customersAPI.create(customerData);
      fetchCustomers();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const handleUpdatePoints = async (points: number, operation: 'add' | 'subtract') => {
    if (!selectedCustomer) return;

    try {
      await customersAPI.updatePoints(selectedCustomer.id, points, operation);
      fetchCustomers();
      setShowPointsModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Error updating points');
    }
  };

  const getTotalLoyaltyPoints = () => {
    return customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 skeleton-shimmer rounded"></div>
          <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
        </div>
        
        <CardSkeleton count={3} />
        
        <div className="card p-6">
          <div className="h-6 w-32 skeleton-shimmer rounded mb-4"></div>
          <div className="h-10 w-full skeleton-shimmer rounded-lg mb-6"></div>
          <TableSkeleton rows={5} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('customers')}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{t('add_customer')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">{t('total_customers')}</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{customers.length}</p>
        </div>
        <div className="card p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">{t('total_loyalty_points')}</h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{getTotalLoyaltyPoints().toLocaleString()}</p>
        </div>
        <div className="card p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">{t('avg_points_per_customer')}</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {customers.length > 0 ? Math.round(getTotalLoyaltyPoints() / customers.length) : 0}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder={t('search_customers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field w-full pl-10 pr-4 py-2"
        />
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('phone')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('member_card')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('loyalty_points')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.memberCard || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GiftIcon className="h-4 w-4 text-purple-500 dark:text-purple-400 mr-1" />
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {customer.loyaltyPoints} points
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowPointsModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {t('manage_points')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm ? 'No customers found matching your search' : 'No customers found'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal
          onSave={handleSaveCustomer}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showPointsModal && selectedCustomer && (
        <ManagePointsModal
          customer={selectedCustomer}
          onSave={handleUpdatePoints}
          onCancel={() => {
            setShowPointsModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default Customers;