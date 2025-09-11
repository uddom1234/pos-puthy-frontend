import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
  rounded?: boolean;
  animated?: boolean;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({
  className = '',
  lines = 1,
  height = 'h-4',
  width = 'w-full',
  rounded = true,
  animated = true
}) => {
  const baseClasses = `skeleton-shimmer ${height} ${width} ${
    rounded ? 'rounded' : ''
  }`;

  if (lines === 1) {
    return <div className={`${baseClasses} ${className}`}></div>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
};

// Specific skeleton components for different UI elements
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-3 text-left">
                  <SkeletonLoader height="h-4" width="w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader height="h-4" width="w-16" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-6">
          <SkeletonLoader height="h-6" width="w-3/4" className="mb-4" />
          <SkeletonLoader height="h-8" width="w-1/2" className="mb-2" />
          <SkeletonLoader height="h-4" width="w-1/3" />
        </div>
      ))}
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-3 sm:p-4">
          <div className="aspect-square mb-3">
            <SkeletonLoader height="h-full" width="w-full" rounded={true} />
          </div>
          <SkeletonLoader height="h-4" width="w-3/4" className="mb-2" />
          <SkeletonLoader height="h-3" width="w-1/2" className="mb-2" />
          <SkeletonLoader height="h-5" width="w-1/3" className="mb-2" />
          <div className="flex justify-between items-center">
            <SkeletonLoader height="h-4" width="w-16" />
            <SkeletonLoader height="h-6" width="w-12" rounded={true} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const FilterSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLoader
          key={index}
          height="h-8"
          width="w-20"
          className="rounded-lg"
        />
      ))}
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SkeletonLoader height="h-4" width="w-1/3" className="mb-2" />
              <SkeletonLoader height="h-3" width="w-1/2" />
            </div>
            <div className="flex space-x-2">
              <SkeletonLoader height="h-8" width="w-16" rounded={true} />
              <SkeletonLoader height="h-8" width="w-16" rounded={true} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="card p-6">
      <SkeletonLoader height="h-6" width="w-1/3" className="mb-4" />
      <div className="h-80">
        <SkeletonLoader height="h-full" width="w-full" rounded={true} />
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 5 }) => {
  return (
    <div className="card p-6">
      <SkeletonLoader height="h-6" width="w-1/4" className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <SkeletonLoader height="h-4" width="w-1/6" className="mb-2" />
            <SkeletonLoader height="h-10" width="w-full" rounded={true} />
          </div>
        ))}
        <div className="flex space-x-3 pt-4">
          <SkeletonLoader height="h-10" width="w-24" rounded={true} />
          <SkeletonLoader height="h-10" width="w-24" rounded={true} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
