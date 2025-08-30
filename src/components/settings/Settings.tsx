import React, { useEffect, useState } from 'react';
import { schemasAPI, DynamicField, UserSchema } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, languageNames, Language } from '../../contexts/LanguageContext';
import { SunIcon, MoonIcon, GlobeAltIcon, CogIcon } from '@heroicons/react/24/outline';

const defaultField: DynamicField = {
  key: '',
  label: '',
  type: 'text',
};

const fieldTypes: Array<DynamicField['type']> = ['text', 'number', 'date', 'select', 'checkbox'];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const userId = user?.id || '';
  const [schema, setSchema] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSchema = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data: UserSchema = await schemasAPI.get(userId, 'order');
      setSchema(data.schema || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, [userId]);

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
    if (!userId) return;
    setSaving(true);
    try {
      // Clean schema: ensure keys are slugified
      const cleaned = schema.map((f) => ({
        ...f,
        key: f.key || f.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      }));
      await schemasAPI.save(userId, 'order', cleaned);
      setSchema(cleaned);
      alert('Schema saved');
    } catch (e) {
      alert('Failed to save schema');
    } finally {
      setSaving(false);
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</span>
          <button onClick={addOption} className="btn-outline text-sm">Add option</button>
        </div>
        {options.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No options yet</div>}
        {options.map((opt, oi) => (
          <div key={oi} className="grid grid-cols-2 gap-2">
            <input
              className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
              placeholder="Label"
              value={opt.label}
              onChange={(e) => updateOption(oi, 'label', e.target.value)}
            />
            <div className="flex space-x-2">
              <input
                className="input-field flex-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                placeholder="Value"
                value={opt.value}
                onChange={(e) => updateOption(oi, 'value', e.target.value)}
              />
              <button onClick={() => removeOption(oi)} className="text-red-600 dark:text-red-400 text-sm">Remove</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">Manage system preferences</div>
      </div>

      {/* Appearance Settings */}
      <div className="card p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <CogIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('appearance')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Toggle between light and dark themes
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
              Choose your preferred language
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Fields Settings */}
      <div className="card p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dynamic Fields</h2>
          <button onClick={addField} className="btn-secondary">Add Field</button>
        </div>

        {loading ? (
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        ) : schema.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No fields configured</div>
        ) : (
          <div className="space-y-4">
            {schema.map((field, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                    <input
                      className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key</label>
                    <input
                      className="input-field bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                      placeholder="auto from label if empty"
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
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
                    <button onClick={() => removeField(index)} className="text-red-600 dark:text-red-400">Remove</button>
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
            {saving ? 'Saving...' : 'Save Schema'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

