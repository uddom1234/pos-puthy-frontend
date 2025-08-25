import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/orders', icon: ShoppingCartIcon, label: 'Orders' },
    { to: '/pos', icon: ClipboardDocumentListIcon, label: 'POS Terminal' },
    { to: '/inventory', icon: CubeIcon, label: 'Inventory' },
    { to: '/income-expense', icon: CurrencyDollarIcon, label: 'Income & Expense' },
    { to: '/reports', icon: ChartBarIcon, label: 'Reports', adminOnly: true },
    { to: '/customers', icon: UserGroupIcon, label: 'Customers' },
    { to: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Café POS</h1>
        <p className="text-gray-400 text-sm">Point of Sale System</p>
      </div>
      
      <nav className="space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 py-2 px-4 rounded transition duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;