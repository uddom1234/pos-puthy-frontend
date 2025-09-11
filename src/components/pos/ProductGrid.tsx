import React, { useState } from 'react';
import { Product } from '../../services/api';
import ProductCustomizationModal from './ProductCustomizationModal';
import { ProductGridSkeleton } from '../common/SkeletonLoader';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, customizations?: any) => void;
  loading: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, loading }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  const handleProductClick = (product: Product) => {
    // Show customization modal if product has option schema
    const hasCustomizations = Array.isArray((product as any).optionSchema) && (product as any).optionSchema.length > 0;
    
    if (hasCustomizations) {
      setSelectedProduct(product);
      setShowCustomizationModal(true);
    } else {
      onAddToCart(product);
    }
  };

  const handleCustomizedAdd = (customizations: any) => {
    if (selectedProduct) {
      onAddToCart(selectedProduct, customizations);
    }
    setShowCustomizationModal(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="card p-4 cursor-pointer transition transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {/* Product Image / Placeholder */}
            {product.imageUrl ? (
              <div className="h-28 sm:h-32 rounded-lg mb-3 overflow-hidden bg-gray-100">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-28 sm:h-32 bg-gradient-to-br from-primary-50 to-primary-200 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">
                  {product.category === 'coffee' ? '☕' : '🍽️'}
                </span>
              </div>
            )}
            
            <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5 truncate" title={product.name}>{product.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 min-h-[1.5rem]">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">
                ${product.price.toFixed(2)}
              </span>
              <div className="flex items-center space-x-2">
                {product.hasStock && (
                  <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    product.stock > product.lowStockThreshold
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {product.stock} left
                  </span>
                )}
                {(product.category === 'coffee' || product.category === 'food') && (
                  <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    Customizable
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCustomizationModal && selectedProduct && (
        <ProductCustomizationModal
          product={selectedProduct}
          isOpen={showCustomizationModal}
          onClose={() => {
            setShowCustomizationModal(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleCustomizedAdd}
        />
      )}
    </>
  );
};

export default ProductGrid;