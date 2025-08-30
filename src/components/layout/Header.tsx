import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BellIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  mobileMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarCollapsed, mobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden xl:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              title={
                window.innerWidth < 768 
                  ? (mobileMenuOpen ? 'Close menu' : 'Open menu')
                  : (sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar')
              }
            >
              <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t('welcome')}, {user?.name}
          </h2>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
            {user?.role.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 relative transition-colors">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 dark:bg-red-500"></span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('confirm')} {t('logout')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to sign out? You will need to log in again to access the system.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;