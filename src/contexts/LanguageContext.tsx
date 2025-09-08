import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'km';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Basic translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'dashboard': 'Dashboard',
    'orders': 'Orders',
    'pos': 'Smach Cafe POS',
    'inventory': 'Inventory',
    'income_expense': 'Income & Expense',
    'reports': 'Reports',
    'customers': 'Customers',
    'settings': 'Settings',
    'welcome': 'Welcome',
    'logout': 'Logout',
    'login': 'Login',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'loading': 'Loading',
    'dark_mode': 'Dark Mode',
    'language': 'Language',
    'appearance': 'Appearance',
    // Extended translations
    'sign_in': 'Sign in',
    'username': 'Username',
    'password': 'Password',
    'demo_credentials': 'Demo Credentials',
    'admin': 'Admin',
    'staff': 'Staff',
    'signing_in': 'Signing in...',
    'total_revenue': 'Total Revenue',
    'total_expenses': 'Total Expenses',
    'net_profit': 'Net Profit',
    'low_stock_alerts': 'Low Stock Alerts',
    'no_low_stock': 'No low stock alerts',
    'quick_actions': 'Quick Actions',
    'active_orders': 'active orders',
    'no_orders_found': 'No orders found',
    'table': 'Table',
    'status': 'Status',
    'payment_status': 'Payment Status',
    'total': 'Total',
    'actions': 'Actions',
    'process_payment': 'Process Payment',
    'print_receipt': 'Print Receipt',
    'confirm': 'Confirm',
    'are_you_sure': 'Are you sure?',
    'name': 'Name',
    'category': 'Category',
    'price': 'Price',
    'stock': 'Stock',
    'low_stock_threshold': 'Low Stock Threshold',
    'description': 'Description',
    'amount': 'Amount',
    'date': 'Date',
    'type': 'Type',
    'income': 'Income',
    'expense': 'Expense',
    'filter': 'Filter',
    'search': 'Search',
    'clear': 'Clear',
    'close': 'Close',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'submit': 'Submit',
    'reset': 'Reset',
    'update': 'Update',
    'create': 'Create',
    'remove': 'Remove',
    'select': 'Select',
    'choose': 'Choose',
    'upload': 'Upload',
    'download': 'Download',
    'export': 'Export',
    'import': 'Import',
    'view': 'View',
    'hide': 'Hide',
    'show': 'Show',
    'open': 'Open',
    'new': 'New',
    'old': 'Old',
    'all': 'All',
    'none': 'None',
    'yes': 'Yes',
    'no': 'No',
    'ok': 'OK',
    'error': 'Error',
    'success': 'Success',
    'warning': 'Warning',
    'info': 'Info',
    'pending': 'Pending',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'paid': 'Paid',
    'unpaid': 'Unpaid',
    'partial': 'Partial',
    'preparing': 'Preparing',
    'ready': 'Ready',
  },
  km: {
    'dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'orders': 'ការបញ្ជាទិញ',
    'pos': 'Smach Cafe POS',
    'inventory': 'សន្លឹកស្តុក',
    'income_expense': 'ចំណូល និង ចំណាយ',
    'reports': 'របាយការណ៍',
    'customers': 'អតិថិជន',
    'settings': 'ការកំណត់',
    'welcome': 'សូមស្វាគមន៍',
    'logout': 'ចាកចេញ',
    'login': 'ចូល',
    'save': 'រក្សាទុក',
    'cancel': 'បោះបង់',
    'delete': 'លុប',
    'edit': 'កែប្រែ',
    'add': 'បន្ថែម',
    'loading': 'កំពុងផ្ទុក',
    'dark_mode': 'របៀបងងឹត',
    'language': 'ភាសា',
    'appearance': 'រូបរាង',
    // Extended translations
    'sign_in': 'ចូល',
    'username': 'ឈ្មោះអ្នកប្រើ',
    'password': 'ពាក្យសម្ងាត់',
    'demo_credentials': 'លេខសម្ងាត់សាកល្បង',
    'admin': 'អ្នកគ្រប់គ្រង',
    'staff': 'បុគ្គលិក',
    'signing_in': 'កំពុងចូល...',
    'total_revenue': 'ចំណូលសរុប',
    'total_expenses': 'ចំណាយសរុប',
    'net_profit': 'ចំណេញសុទ្ធ',
    'low_stock_alerts': 'ការជូនដំណឹងទំនិញស្ទើរអស់',
    'no_low_stock': 'មិនមានការជូនដំណឹងទំនិញស្ទើរអស់',
    'quick_actions': 'សកម្មភាពរហ័ស',
    'active_orders': 'ការបញ្ជាទិញសកម្ម',
    'no_orders_found': 'រកមិនឃើញការបញ្ជាទិញ',
    'table': 'តុ',
    'status': 'ស្ថានភាព',
    'payment_status': 'ស្ថានភាពបង់ប្រាក់',
    'total': 'សរុប',
    'actions': 'សកម្មភាព',
    'process_payment': 'ដំណើរការបង់ប្រាក់',
    'print_receipt': 'បោះពុម្ពបង្កាន់ដៃ',
    'confirm': 'បញ្ជាក់',
    'are_you_sure': 'តើអ្នកពិតជាចង់?',
    'name': 'ឈ្មោះ',
    'category': 'ប្រភេទ',
    'price': 'តម្លៃ',
    'stock': 'ស្តុក',
    'low_stock_threshold': 'កម្រិតទំនិញស្ទើរអស់',
    'description': 'ការពិពណ៌នា',
    'amount': 'ចំនួន',
    'date': 'កាលបរិច្ឆេទ',
    'type': 'ប្រភេទ',
    'income': 'ចំណូល',
    'expense': 'ចំណាយ',
    'filter': 'តម្រង',
    'search': 'ស្វែងរក',
    'clear': 'សម្អាត',
    'close': 'បិទ',
    'back': 'ត្រលប់',
    'next': 'បន្ទាប់',
    'previous': 'មុន',
    'submit': 'ដាក់ស្នើ',
    'reset': 'កំណត់ឡើងវិញ',
    'update': 'ធ្វើបច្ចុប្បន្នភាព',
    'create': 'បង្កើត',
    'remove': 'យកចេញ',
    'select': 'ជ្រើសរើស',
    'choose': 'ជ្រើសរើស',
    'upload': 'ផ្ទុកឡើង',
    'download': 'ទាញយក',
    'export': 'នាំចេញ',
    'import': 'នាំចូល',
    'view': 'មើល',
    'hide': 'លាក់',
    'show': 'បង្ហាញ',
    'open': 'បើក',
    'new': 'ថ្មី',
    'old': 'ចាស់',
    'all': 'ទាំងអស់',
    'none': 'គ្មាន',
    'yes': 'បាទ/ចាស',
    'no': 'ទេ',
    'ok': 'យល់ព្រម',
    'error': 'កំហុស',
    'success': 'ជោគជ័យ',
    'warning': 'ការព្រមាន',
    'info': 'ព័ត៌មាន',
    'pending': 'កំពុងរង់ចាំ',
    'completed': 'បានបញ្ចប់',
    'cancelled': 'បានលុបចោល',
    'paid': 'បានបង់',
    'unpaid': 'មិនទាន់បង់',
    'partial': 'បង់ផ្នែក',
    'preparing': 'កំពុងរៀបចំ',
    'ready': 'រួចរាល់',
  }
};

const languageNames: Record<Language, string> = {
  en: 'English',
  km: 'ខ្មែរ',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && savedLanguage in translations) {
      return savedLanguage;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    if (browserLang in translations) {
      return browserLang;
    }
    
    return 'en';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('language', language);
    
    // Set document language
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export { languageNames };
export type { Language };
