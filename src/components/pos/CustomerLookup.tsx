import React, { useState } from 'react';
import { customersAPI, Customer } from '../../services/api';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface CustomerLookupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const CustomerLookup: React.FC<CustomerLookupProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const [searchType, setSearchType] = useState<'phone' | 'memberCard'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    memberCard: '',
  });

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');
    setFoundCustomer(null);

    try {
      const customer = await customersAPI.search(
        searchType === 'phone' ? searchValue : undefined,
        searchType === 'memberCard' ? searchValue : undefined
      );

      if (customer) {
        setFoundCustomer(customer);
      } else {
        setError('Customer not found');
      }
    } catch (error) {
      setError('Error searching for customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      setError('Name and phone are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const customer = await customersAPI.create({
        name: newCustomer.name,
        phone: newCustomer.phone,
        memberCard: newCustomer.memberCard || undefined,
      });

      onSelectCustomer(customer);
      onClose();
    } catch (error) {
      setError('Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const resetForm = () => {
    setSearchValue('');
    setFoundCustomer(null);
    setError('');
    setShowCreateForm(false);
    setNewCustomer({ name: '', phone: '', memberCard: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/50 p-0 sm:p-6">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-2xl sm:max-w-lg md:max-w-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-semibold tracking-tight">Customer Lookup</h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-3 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {!showCreateForm ? (
            <>
              {/* Search Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Customer</h3>
                <div className="flex gap-3">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      searchType === 'phone' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSearchType('phone')}
                  >
                    Phone
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      searchType === 'memberCard' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSearchType('memberCard')}
                  >
                    Member Card
                  </button>
                </div>
                <div className="flex items-stretch gap-3">
                  <input
                    type={searchType === 'phone' ? 'tel' : 'text'}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={searchType === 'phone' ? 'Enter phone number' : 'Enter member card id'}
                    className="input-field flex-1 text-base py-3 text-gray-900 placeholder-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchValue.trim()}
                    className="btn-primary px-5 py-3 disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <MagnifyingGlassIcon className="h-5 w-5 sm:ml-2 inline" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Search by exact phone or member card. You can create a new customer if not found.</p>
              </div>

              {/* Search Results */}
              {foundCustomer && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 sm:p-5">
                  <h4 className="font-semibold text-green-900 mb-3">Customer Found</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-green-900">
                    <p><span className="font-medium">Name:</span> {foundCustomer.name || '-'}</p>
                    <p><span className="font-medium">Phone:</span> {foundCustomer.phone}</p>
                    {foundCustomer.memberCard && (
                      <p className="sm:col-span-2"><span className="font-medium">Member Card:</span> {foundCustomer.memberCard}</p>
                    )}
                    <p className="sm:col-span-2"><span className="font-medium">Loyalty Points:</span> {foundCustomer.loyaltyPoints}</p>
                  </div>
                  <button
                    onClick={() => handleSelectCustomer(foundCustomer)}
                    className="btn-primary mt-4 w-full py-3"
                  >
                    Select Customer
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Create New Customer Button */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full btn-outline flex items-center justify-center space-x-2 py-3"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  <span>Create New Customer</span>
                </button>
              </div>
            </>
          ) : (
            /* Create Customer Form */
            <div>
              <h3 className="text-lg font-semibold mb-4">Create New Customer</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field text-base py-3"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-field text-base py-3"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Card (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustomer.memberCard}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, memberCard: e.target.value }))}
                    className="input-field text-base py-3"
                    placeholder="MEMBER001"
                  />
                </div>

                {error && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateCustomer}
                    disabled={loading || !newCustomer.name.trim() || !newCustomer.phone.trim()}
                    className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLookup;