import React, { useState, useRef, useEffect } from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  previewClassName?: string;
  children?: React.ReactNode;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  src, 
  alt, 
  className = '', 
  previewClassName = '',
  children 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    console.log('ImagePreview Mouse enter:', { src, alt, hasSrc: !!src });
    e.stopPropagation(); // Prevent event bubbling
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate preview position
    let x = rect.right + 10; // Default: show to the right
    let y = rect.top;

    // Adjust if preview would go off screen horizontally
    if (x + 300 > viewportWidth) {
      x = rect.left - 310; // Show to the left instead
    }

    // Adjust if preview would go off screen vertically
    if (y + 200 > viewportHeight) {
      // If near bottom, show above the element instead of below
      y = rect.top - 210; // Show above the element
      
      // If still off screen at the top, adjust to stay within viewport
      if (y < 10) {
        y = 10; // Minimum 10px from top
      }
    }
    
    setPreviewPosition({ x, y });
    setShowPreview(true);
    console.log('Preview should show:', { x, y, src, alt, showPreview: true });
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setShowPreview(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!showPreview) return;
    e.stopPropagation(); // Prevent event bubbling
    
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = rect.right + 10;
    let y = rect.top;

    // Adjust if preview would go off screen horizontally
    if (x + 300 > viewportWidth) {
      x = rect.left - 310;
    }

    // Adjust if preview would go off screen vertically
    if (y + 200 > viewportHeight) {
      // If near bottom, show above the element instead of below
      y = rect.top - 210; // Show above the element
      
      // If still off screen at the top, adjust to stay within viewport
      if (y < 10) {
        y = 10; // Minimum 10px from top
      }
    }
    
    setPreviewPosition({ x, y });
  };

  return (
    <>
      <div
        className={`relative ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
      
      {showPreview && src && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <img
              src={src}
              alt={alt}
              className="w-80 h-80 object-cover"
              style={{ maxWidth: '300px', maxHeight: '300px' }}
            />
            <div className="p-2 bg-gray-50 dark:bg-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-300 text-center truncate">
                {alt}
              </p>
            </div>
          </div>
        </div>
      )}
      {showPreview && !src && (
        <div
          className="fixed z-[9999] pointer-events-none bg-blue-500 text-white p-4 rounded-lg"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
          }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-sm font-bold">{alt}</div>
            <div className="text-xs">No image available</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;
