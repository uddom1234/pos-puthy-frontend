import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
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

const logo = 'https://pu-thy.s3.us-east-005.backblazeb2.com/logo.PNG';

interface SidebarProps {
  collapsed?: boolean;
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  mobileMenuOpen = false, 
  onMobileMenuClose 
}) => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { to: '/dashboard', icon: HomeIcon, label: t('dashboard') },
    { to: '/orders', icon: ShoppingCartIcon, label: t('orders') },
    { to: '/pos', icon: ClipboardDocumentListIcon, label: t('pos') },
    { to: '/inventory', icon: CubeIcon, label: t('inventory') },
    { to: '/income-expense', icon: CurrencyDollarIcon, label: t('income_expense') },
    { to: '/reports', icon: ChartBarIcon, label: t('reports'), adminOnly: true },
    { to: '/customers', icon: UserGroupIcon, label: t('customers') },
    { to: '/settings', icon: Cog6ToothIcon, label: t('settings') },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleNavClick = () => {
    // Close mobile menu when a nav item is clicked
    if (onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  return (
    <div className={`bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 ${collapsed ? 'w-16' : 'w-64'} space-y-6 py-7 px-2 
      fixed inset-y-0 left-0 z-30 transform transition-all duration-200 ease-in-out border-r border-gray-700 dark:border-gray-600
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:relative md:translate-x-0`}>
      <div className="text-center">
        {collapsed ? (
          <img src={logo} alt="Smach Cafe" className="mx-auto h-8 w-8 object-contain" />
        ) : (
          <>
            <img src={logo} alt="Smach Cafe" className="mx-auto mb-2 h-12 w-12 object-contain" />
            <h1 className="text-2xl font-bold text-white dark:text-gray-100">Smach Cafe</h1>
            <p className="text-gray-400 dark:text-gray-300 text-sm">Point of Sale System</p>
          </>
        )}
      </div>
      
      <nav className="space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} py-2 px-4 rounded transition duration-200 ${
                  isActive
                    ? 'bg-primary-600 dark:bg-primary-500 text-white dark:text-white'
                    : 'text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white dark:hover:text-gray-100'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;