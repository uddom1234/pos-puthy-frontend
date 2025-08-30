import React, { useEffect, useState } from 'react';
import { reportsAPI, productsAPI, Product } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard')}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_revenue')}
          value={`$${dailySummary?.totalRevenue.toFixed(2) || '0.00'}`}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Today's Transactions"
          value={dailySummary?.transactionCount.toString() || '0'}
          icon={ShoppingBagIcon}
          color="blue"
        />
        <StatCard
          title={"Today's " + t('orders')}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-semibold">${monthlySummary?.totalRevenue.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-semibold text-red-600">-${monthlySummary?.totalExpenses.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Orders:</span>
              <span className="font-semibold">{monthlySummary?.orderCount ?? 0}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 font-semibold">Net Profit:</span>
              <span className="font-bold text-green-600">${monthlySummary?.netProfit.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Low Stock Alerts</h3>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{product.stock} left</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Min: {product.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No low stock alerts</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/pos" className="btn-primary text-center">New Order</a>
          <a href="/inventory" className="btn-secondary text-center">Add Product</a>
          <a href="/reports" className="btn-outline text-center">View Reports</a>
          <button onClick={fetchDashboardData} className="btn-outline text-center">Refresh</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;