import React, { useState, useEffect, useRef } from 'react';

interface NumberInputProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  required?: boolean;
  allowDecimals?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  min,
  max,
  step = 1,
  className = "input-field",
  required = false,
  allowDecimals = true
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const isEditingRef = useRef(false);

  useEffect(() => {
    // Only update display value if we're not currently editing
    if (!isEditingRef.current) {
      if (value === null || value === undefined) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toString());
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    isEditingRef.current = true;

    // Allow empty string for deletion
    if (inputValue === '') {
      onChange(null);
      return;
    }

    // Parse the number
    const numericValue = allowDecimals ? parseFloat(inputValue) : parseInt(inputValue, 10);
    
    // Check if it's a valid number
    if (!isNaN(numericValue)) {
      // Apply min/max constraints
      let finalValue = numericValue;
      if (min !== undefined && finalValue < min) {
        finalValue = min;
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max;
      }
      onChange(finalValue);
    } else if (inputValue !== '' && inputValue !== '-' && !inputValue.endsWith('.')) {
      // Reset to previous valid value if input is invalid
      setDisplayValue(value?.toString() || '');
    }
  };

  const handleFocus = () => {
    isEditingRef.current = true;
  };

  const handleBlur = () => {
    isEditingRef.current = false;
    // On blur, if empty and required, set to 0
    if (displayValue === '' && required) {
      setDisplayValue('0');
      onChange(0);
    } else if (displayValue === '' && !required) {
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }

    // Ensure that it is a number and stop the keypress
    if (allowDecimals) {
      // Allow decimal point
      if (e.key === '.' && displayValue.indexOf('.') === -1) {
        return;
      }
      // Allow minus sign at the beginning
      if (e.key === '-' && displayValue.length === 0 && (min === undefined || min < 0)) {
        return;
      }
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    } else {
      // Integer only
      if (e.key === '-' && displayValue.length === 0 && (min === undefined || min < 0)) {
        return;
      }
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      min={min}
      max={max}
      step={step}
    />
  );
};

export default NumberInput;
