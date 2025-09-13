import React, { useState } from 'react';
import { Product } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCustomizationModal from './ProductCustomizationModal';
import { ProductGridSkeleton } from '../common/SkeletonLoader';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, customizations?: any) => void;
  loading: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, loading }) => {
  const { t } = useLanguage();
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
        <p className="text-gray-500 text-lg">{t('no_products_found')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="card p-4 transition transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <div className="cursor-pointer" onClick={() => handleProductClick(product)}>
              {/* Product Image / Placeholder */}
              {product.imageUrl ? (
                <div className="h-40 sm:h-48 rounded-lg mb-3 overflow-hidden bg-gray-100">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 sm:h-48 bg-gradient-to-br from-primary-50 to-primary-200 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl">
                    {product.category === 'coffee' ? '☕' : '🍽️'}
                  </span>
                </div>
              )}
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate text-lg" title={product.name}>{product.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
                  ${product.price.toFixed(2)}
                </span>
                <div className="flex items-center space-x-2">
                  {product.hasStock && (
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      product.stock > product.lowStockThreshold
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {product.stock} {t('left')}
                    </span>
                  )}
                  {(product.category === 'coffee' || product.category === 'food') && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {t('customizable')}
                    </span>
                  )}
                </div>
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