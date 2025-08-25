import React from 'react';
import { DynamicField } from '../../services/api';

interface DynamicFormProps {
  schema: DynamicField[];
  values: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, values, onChange }) => {
  const update = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      {schema.map((field) => {
        const key = field.key;
        const label = field.label || key;
        const val = values[key] ?? '';
        switch (field.type) {
          case 'text':
          case 'number':
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={field.type}
                  className="input-field"
                  value={val}
                  onChange={(e) => update(key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              </div>
            );
          case 'date':
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="date"
                  className="input-field"
                  value={val}
                  onChange={(e) => update(key, e.target.value)}
                />
              </div>
            );
          case 'select':
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <select className="input-field" value={val} onChange={(e) => update(key, e.target.value)}>
                  <option value="">Select...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          case 'checkbox':
            return (
              <div key={key} className="flex items-center space-x-2">
                <input
                  id={`chk_${key}`}
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!val}
                  onChange={(e) => update(key, e.target.checked)}
                />
                <label htmlFor={`chk_${key}`} className="text-sm text-gray-700">{label}</label>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default DynamicForm;


