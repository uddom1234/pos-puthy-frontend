import React, { useEffect, useState } from 'react';
import { reportsAPI, productsAPI, Product } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCambodianTime } from '../../utils/timeUtils';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { CardSkeleton, ChartSkeleton } from '../common/SkeletonLoader';

interface SalesSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  transactionCount: number;
  paidTransactionCount?: number;
  unpaidTransactionCount?: number;
  orderCount?: number;
  orderTotal?: number;
  incomeByCategory?: Record<string, number>;
  expenseByCategory?: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [dailySummary, setDailySummary] = useState<SalesSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<SalesSummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [dailyData, monthlyData, lowStockData] = await Promise.all([
        reportsAPI.getSalesSummary({ period: 'daily' }),
        reportsAPI.getSalesSummary({ period: 'monthly' }),
        productsAPI.getLowStock(),
      ]);

      setDailySummary(dailyData);
      setMonthlySummary(monthlyData);
      setLowStockProducts(lowStockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const id = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton-shimmer rounded"></div>
        
        <CardSkeleton count={4} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        
        <div className="card p-6">
          <div className="h-6 w-48 skeleton-shimmer rounded mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="card p-4">
                <div className="h-16 w-16 skeleton-shimmer rounded mb-3"></div>
                <div className="h-4 w-20 skeleton-shimmer rounded mb-2"></div>
                <div className="h-3 w-16 skeleton-shimmer rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    color: 'blue' | 'green' | 'yellow' | 'red';
  }> = ({ title, value, icon: Icon, trend, color }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };

    return (
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {trend && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                <ArrowTrendingUpIcon className="inline h-4 w-4 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard')}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatCambodianTime(new Date(), {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <StatCard
          title={t('total_revenue')}
          value={`$${dailySummary?.totalRevenue.toFixed(2) || '0.00'}`}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title={t('todays_transactions')}
          value={dailySummary?.transactionCount.toString() || '0'}
          icon={ShoppingBagIcon}
          color="blue"
        />
        <StatCard
          title={t('todays_orders')}
          value={(dailySummary?.orderCount ?? 0).toString()}
          icon={ShoppingBagIcon}
          color="blue"
        />
        <StatCard
          title={t('net_profit')}
          value={`$${dailySummary?.netProfit.toFixed(2) || '0.00'}`}
          icon={ArrowTrendingUpIcon}
          color="green"
        />
        <StatCard
          title={t('low_stock_alerts')}
          value={lowStockProducts.length.toString()}
          icon={ExclamationTriangleIcon}
          color="yellow"
        />
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('monthly_summary')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('total_revenue_label')}</span>
              <span className="font-semibold">${monthlySummary?.totalRevenue.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('total_expenses_label')}</span>
              <span className="font-semibold text-red-600">-${monthlySummary?.totalExpenses.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('orders_label')}</span>
              <span className="font-semibold">{monthlySummary?.orderCount ?? 0}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 dark:text-gray-100 font-semibold">{t('net_profit_label')}</span>
              <span className="font-bold text-green-600">${monthlySummary?.netProfit.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('low_stock_alerts_title')}</h3>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{product.stock} {t('left')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('min')}: {product.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('no_low_stock_alerts')}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('quick_actions_title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a href="/pos" className="btn-primary text-center py-3">{t('new_order')}</a>
          <a href="/inventory" className="btn-secondary text-center py-3">{t('add_product')}</a>
          <a href="/reports" className="btn-outline text-center py-3">{t('view_reports')}</a>
          <button onClick={fetchDashboardData} className="btn-outline text-center py-3">{t('refresh')}</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;