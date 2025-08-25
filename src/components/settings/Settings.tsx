import React, { useEffect, useState } from 'react';
import { schemasAPI, DynamicField, UserSchema } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const defaultField: DynamicField = {
  key: '',
  label: '',
  type: 'text',
};

const fieldTypes: Array<DynamicField['type']> = ['text', 'number', 'date', 'select', 'checkbox'];

const Settings: React.FC = () => {
  const { user } = useAuth();
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
          <span className="text-sm font-medium text-gray-700">Options</span>
          <button onClick={addOption} className="btn-outline text-sm">Add option</button>
        </div>
        {options.length === 0 && <div className="text-sm text-gray-500">No options yet</div>}
        {options.map((opt, oi) => (
          <div key={oi} className="grid grid-cols-2 gap-2">
            <input
              className="input-field"
              placeholder="Label"
              value={opt.label}
              onChange={(e) => updateOption(oi, 'label', e.target.value)}
            />
            <div className="flex space-x-2">
              <input
                className="input-field flex-1"
                placeholder="Value"
                value={opt.value}
                onChange={(e) => updateOption(oi, 'value', e.target.value)}
              />
              <button onClick={() => removeOption(oi)} className="text-red-600 text-sm">Remove</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <div className="text-sm text-gray-500">Manage order dynamic fields</div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Dynamic Fields</h2>
          <button onClick={addField} className="btn-secondary">Add Field</button>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : schema.length === 0 ? (
          <div className="text-gray-500">No fields configured</div>
        ) : (
          <div className="space-y-4">
            {schema.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      className="input-field"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                    <input
                      className="input-field"
                      placeholder="auto from label if empty"
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      className="input-field"
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as DynamicField['type'], options: e.target.value === 'select' ? (field.options || []) : undefined })}
                    >
                      {fieldTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => removeField(index)} className="text-red-600">Remove</button>
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

