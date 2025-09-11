import React from 'react';
import NumberInput from '../common/NumberInput';

export type OptionFieldType = 'single' | 'multi';

export interface OptionItem {
  label: string;
  value: string;
  priceDelta: number;
  valueType?: 'text' | 'number' | 'boolean' | 'date';
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null; // ISO yyyy-mm-dd
}

export interface OptionField {
  key: string;
  label: string;
  type: OptionFieldType;
  required?: boolean;
  options: OptionItem[];
}

interface Props {
  value: OptionField[];
  onChange: (next: OptionField[]) => void;
}

const emptyField: OptionField = {
  key: '',
  label: '',
  type: 'single',
  required: false,
  options: [],
};

const OptionSchemaBuilder: React.FC<Props> = ({ value, onChange }) => {
  const addField = () => onChange([...(value || []), { ...emptyField }]);
  const updateField = (index: number, patch: Partial<OptionField>) => {
    onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };
  const removeField = (index: number) => onChange(value.filter((_, i) => i !== index));

  const addOption = (fi: number) => {
    const opts = value[fi].options || [];
    const next = [...opts, { label: '', value: '', priceDelta: 0, valueType: 'text' as const, valueNumber: null, valueBoolean: null, valueDate: null }];
    updateField(fi, { options: next });
  };
  const updateOption = (fi: number, oi: number, key: keyof OptionItem, val: any) => {
    const opts = [...(value[fi].options || [])];
    const current = { ...opts[oi], [key]: key === 'priceDelta' ? Number(val) : val } as OptionItem;
    opts[oi] = current;
    updateField(fi, { options: opts });
  };
  const removeOption = (fi: number, oi: number) => {
    const opts = (value[fi].options || []).filter((_, i) => i !== oi);
    updateField(fi, { options: opts });
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold">Option Schema (for ordering)</h3>
        <button type="button" className="btn-secondary" onClick={addField}>Add Option Group</button>
      </div>

      {(value || []).length === 0 && <div className="text-sm text-gray-500">No option groups</div>}

      {(value || []).map((field, fi) => (
        <div key={fi} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input className="input-field min-w-0" value={field.label} onChange={(e) => updateField(fi, { label: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input className="input-field min-w-0" placeholder="auto from label if empty" value={field.key} onChange={(e) => updateField(fi, { key: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input-field" value={field.type} onChange={(e) => updateField(fi, { type: e.target.value as OptionFieldType })}>
                <option value="single">Single Choice (radio/select)</option>
                <option value="multi">Multiple Choice (checkboxes)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" className="text-red-600" onClick={() => removeField(fi)}>Remove Group</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Options</span>
              <button type="button" className="btn-outline text-sm" onClick={() => addOption(fi)}>Add Option</button>
            </div>
            {(field.options || []).length === 0 && <div className="text-sm text-gray-500">No options yet</div>}
            {(field.options || []).map((opt, oi) => (
              <div key={oi} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                <input className="input-field min-w-0" placeholder="Label" value={opt.label} onChange={(e) => updateOption(fi, oi, 'label', e.target.value)} />

                <select className="input-field" value={opt.valueType || 'text'} onChange={(e) => updateOption(fi, oi, 'valueType', e.target.value as any)}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>

                {/* value control by type */}
                { (opt.valueType || 'text') === 'text' && (
                  <input className="input-field min-w-0" placeholder="Value" value={opt.value} onChange={(e) => updateOption(fi, oi, 'value', e.target.value)} />
                )}
                { opt.valueType === 'number' && (
                  <NumberInput
                    value={opt.valueNumber ?? null}
                    onChange={(v) => updateOption(fi, oi, 'valueNumber', v)}
                    placeholder="0"
                    allowDecimals={true}
                    className="input-field min-w-0"
                  />
                )}
                { opt.valueType === 'boolean' && (
                  <select className="input-field" value={opt.valueBoolean ? 'true' : 'false'} onChange={(e) => updateOption(fi, oi, 'valueBoolean', e.target.value === 'true')}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                )}
                { opt.valueType === 'date' && (
                  <input type="date" className="input-field" value={opt.valueDate || ''} onChange={(e) => updateOption(fi, oi, 'valueDate', e.target.value)} />
                )}

                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Price Delta</label>
                    <NumberInput
                      value={opt.priceDelta || null}
                      onChange={(value) => updateOption(fi, oi, 'priceDelta', value || 0)}
                      placeholder="0.00"
                      step={0.01}
                      allowDecimals={true}
                      className="input-field min-w-0"
                    />
                  </div>
                  <button type="button" className="text-red-600 text-sm" onClick={() => removeOption(fi, oi)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptionSchemaBuilder;


