import React, { useEffect, useState } from 'react';
import { schemasAPI, DynamicField, UserSchema, usersAPI, User } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useLanguage, languageNames, Language } from '../../contexts/LanguageContext';
import { SunIcon, MoonIcon, GlobeAltIcon, CogIcon, UserPlusIcon, KeyIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import NumberInput from '../common/NumberInput';

const defaultField: DynamicField = {
  key: '',
  label: '',
  type: 'text',
};

const fieldTypes: Array<DynamicField['type']> = ['text', 'number', 'date', 'select', 'checkbox'];

const Settings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currencyRate, setCurrencyRate, wifiInfo, setWifiInfo, phoneNumber, setPhoneNumber, location, setLocation } = useAppSettings();
  const userId = user?.id || '';
  const [schema, setSchema] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const data: UserSchema = await schemasAPI.get('order');
      setSchema(data.schema || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const addField = () => {
    setSchema((prev) => [...prev, { ...defaultField }]);
  };

  const updateField = (index: number, field: Partial<DynamicField>) => {
    setSchema((prev) => prev.map((f, i) => (i === index ? { ...f, ...field } : f)));
  };

  const removeField = (index: number) => {
    setSchema((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    try {
      // Clean schema: ensure keys are slugified
      const cleaned = schema.map((f) => ({
        ...f,
        key: f.key || f.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      }));
      await schemasAPI.save('order', cleaned);
      setSchema(cleaned);
      alert('Schema saved');
    } catch (e) {
      alert('Failed to save schema');
    } finally {
      setSaving(false);
    }
  };

  // User management functions
  const handleCreateUser = async (userData: { username: string; password: string; name: string; role: 'admin' | 'staff' }) => {
    try {
      await usersAPI.create(userData);
      loadUsers();
      setShowUserModal(false);
      alert('User created successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userData: { id: string; name: string; role: 'admin' | 'staff' }) => {
    try {
      await usersAPI.update(userData.id, { name: userData.name, role: userData.role });
      loadUsers();
      setEditingUser(null);
      alert('User updated successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleUserSave = async (userData: any) => {
    if (editingUser) {
      await handleUpdateUser(userData);
    } else {
      await handleCreateUser(userData);
    }
  };

  const handleChangePassword = async (id: string, newPassword: string) => {
    try {
      await usersAPI.changePassword(id, newPassword);
      setShowPasswordModal(false);
      setPasswordUser(null);
      alert('Password changed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersAPI.delete(id);
      loadUsers();
      alert('User deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const renderOptionsEditor = (field: DynamicField, index: number) => {
    if (field.type !== 'select') return null;
    const options = field.options || [];
    const updateOption = (idx: number, key: 'label' | 'value', value: string) => {
      const next = [...options];
      next[idx] = { ...next[idx], [key]: value } as { label: string; value: string };
      updateField(index, { options: next });
    };
    const addOption = () => updateField(index, { options: [...options, { label: '', value: '' }] });
    const removeOption = (idx: number) => updateField(index, { options: options.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('field_options')}</span>
          <button onClick={addOption} className="btn-outline text-sm">{t('add_option')}</button>
        </div>
        {options.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">{t('no_options_yet')}</div>}
        {options.map((opt, oi) => (
          <div key={oi} className="grid grid-cols-2 gap-2">
            <input
              className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
              placeholder={t('label')}
              value={opt.label}
              onChange={(e) => updateOption(oi, 'label', e.target.value)}
            />
            <div className="flex space-x-2">
              <input
                className="input-field flex-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                placeholder={t('value')}
                value={opt.value}
                onChange={(e) => updateOption(oi, 'value', e.target.value)}
              />
              <button onClick={() => removeOption(oi)} className="text-red-600 dark:text-red-400 text-sm">{t('remove')}</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">{t('manage_system_preferences')}</div>
      </div>

      {/* Appearance & General Settings */}
      <div className="card p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <CogIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('appearance')}</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Dark Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <MoonIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <SunIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dark_mode')}
                </label>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('toggle_theme_description')}
            </p>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('language')}
              </label>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="input-field bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('choose_language_description')}
            </p>
          </div>

          {/* Currency & Contact Settings */}
          <div className="space-y-3 lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('currency_rate')}</label>
                <NumberInput
                  value={currencyRate}
                  onChange={(value) => setCurrencyRate(value || 0)}
                  min={0}
                  step={1}
                  className="input-field bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  allowDecimals={false}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('common_values')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('location') || 'Location'}</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('location_description') || 'Store location or address'}
                  className="input-field bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('wifi_info')}</label>
                <input
                  value={wifiInfo}
                  onChange={(e) => setWifiInfo(e.target.value)}
                  placeholder={t('wifi_info_description')}
                  className="input-field bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone_number')}</label>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t('phone_number_description')}
                  className="input-field bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Only: User Management Section */}
      {isAdmin && (
        <div className="card p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <UserPlusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
            </div>
            <button 
              onClick={() => setShowUserModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>

          {userLoading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((u) => (
                    <tr key={u.id} className={u.id === user?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {u.username}
                        {u.id === user?.id && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setPasswordUser(u);
                              setShowPasswordModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center space-x-1"
                          >
                            <KeyIcon className="h-4 w-4" />
                            <span>Password</span>
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Fields Settings */}
      <div className="card p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('order_fields')}</h2>
          <button onClick={addField} className="btn-secondary">{t('add_field')}</button>
        </div>

        {loading ? (
          <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
        ) : schema.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">{t('no_fields_configured')}</div>
        ) : (
          <div className="space-y-4">
            {schema.map((field, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label')}</label>
                    <input
                      className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('key')}</label>
                    <input
                      className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                      placeholder={t('auto_from_label')}
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type')}</label>
                    <select
                      className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as DynamicField['type'], options: e.target.value === 'select' ? (field.options || []) : undefined })}
                    >
                      {fieldTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => removeField(index)} className="text-red-600 dark:text-red-400">{t('remove')}</button>
                  </div>
                </div>
                <div className="mt-4">{renderOptionsEditor(field, index)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Product dynamic fields removed */}

        <div className="mt-6 flex justify-end">
          <button disabled={saving} onClick={save} className="btn-primary disabled:opacity-50">
            {saving ? t('saving') : t('save_schema')}
          </button>
        </div>
      </div>

      {/* User Creation/Edit Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onSave={handleUserSave}
          onCancel={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && passwordUser && (
        <PasswordModal
          user={passwordUser}
          onSave={handleChangePassword}
          onCancel={() => {
            setShowPasswordModal(false);
            setPasswordUser(null);
          }}
        />
      )}
    </div>
  );
};

// User Creation/Edit Modal Component
const UserModal: React.FC<{
  user?: User | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    name: user?.name || '',
    role: user?.role || 'staff' as 'admin' | 'staff',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !formData.password) {
      alert('Password is required for new users');
      return;
    }
    
    // For update, include the user ID
    if (user) {
      onSave({ id: user.id, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="input-field"
              required
              disabled={!!user}
            />
            {user && <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>}
          </div>
          
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))}
              className="input-field"
              required
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 btn-outline">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Password Change Modal Component
const PasswordModal: React.FC<{
  user: User;
  onSave: (id: string, password: string) => void;
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    onSave(user.id, password);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Change Password for {user.username}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 btn-outline">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

