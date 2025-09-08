import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export interface ExportOption {
  id: string;
  label: string;
  extension: string;
  mimeType: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ExportDropdownProps {
  onExport: (format: string) => void;
  data: any;
  filename: string;
  className?: string;
  disabled?: boolean;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExport,
  data,
  filename,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const exportOptions: ExportOption[] = [
    {
      id: 'json',
      label: 'JSON',
      extension: 'json',
      mimeType: 'application/json'
    },
    {
      id: 'excel',
      label: 'Excel',
      extension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    {
      id: 'csv',
      label: 'CSV',
      extension: 'csv',
      mimeType: 'text/csv'
    },
    {
      id: 'pdf',
      label: 'PDF',
      extension: 'pdf',
      mimeType: 'application/pdf'
    },
    {
      id: 'word',
      label: 'Word',
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = (option: ExportOption) => {
    onExport(option.id);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DocumentArrowDownIcon className="h-5 w-5" />
        <span>Export</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleExport(option)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {option.icon && <option.icon className="h-4 w-4 mr-3" />}
                <span className="flex-1 text-left">{option.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">.{option.extension}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
