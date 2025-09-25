import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
// const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://146.190.81.53/api';


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // Ensure headers object exists and set Authorization
    (config.headers = config.headers || {} as any);
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  priceKhr?: number;
  stock: number;
  hasStock: boolean;
  lowStockThreshold: number;
  description: string;
  metadata?: Record<string, any>;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    customizations?: any;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'qr';
  status: 'paid' | 'unpaid';
  date: string;
  customerId?: string;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  cashReceived?: number;
  changeBack?: number;
}

export interface IncomeExpense {
  id: string;
  type: 'income' | 'expense';
  category: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  description: string;
  amount: number;
  date: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  loyaltyPoints: number;
  memberCard?: string;
}

export interface Order {
  id: string;
  customerId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    customizations?: any;
  }>;
  total: number;
  createdAt: string;
  tableNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
  paymentStatus?: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'qr';
}

export interface DynamicField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: Array<{ label: string; value: string }>;
}

export interface UserSchema {
  type: 'product' | 'order';
  schema: DynamicField[];
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// User Management API (Admin only)
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  create: async (userData: { username: string; password: string; name: string; role: 'admin' | 'staff' }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id: string, userData: { name?: string; role?: 'admin' | 'staff' }) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  changePassword: async (id: string, newPassword: string) => {
    const response = await api.put(`/users/${id}/password`, { password: newPassword });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const currencyRatesAPI = {
  getAll: async () => {
    const response = await api.get('/currency-rates');
    return response.data;
  },
  
  update: async (fromCurrency: string, toCurrency: string, rate: number) => {
    const response = await api.put('/currency-rates', { fromCurrency, toCurrency, rate });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (category?: string) => {
    const response = await api.get('/products', { params: { category } });
    return response.data;
  },
  
  getLowStock: async () => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },
  
  create: async (product: Omit<Product, 'id'>) => {
    const response = await api.post('/products', product);
    return response.data;
  },
  
  update: async (id: string, product: Partial<Product>) => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },
  
  checkOrders: async (id: string) => {
    const response = await api.get(`/products/${id}/orders`);
    return response.data;
  },
  
  delete: async (id: string, force: boolean = false) => {
    const response = await api.delete(`/products/${id}?force=${force}`);
    return response.data;
  },
  
  bulkDelete: async (ids: string[], force: boolean = false) => {
    const response = await api.delete('/products/bulk', { data: { ids, force } });
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  list: async (): Promise<string[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
  add: async (name: string): Promise<string[]> => {
    const response = await api.post('/categories', { name });
    return response.data;
  },
  remove: async (name: string): Promise<string[]> => {
    const response = await api.delete(`/categories/${encodeURIComponent(name)}`);
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (filters?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },
  
  create: async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },
};

// Income/Expense API
export const incomeExpenseAPI = {
  getAll: async (filters?: { 
    startDate?: string; 
    endDate?: string; 
    type?: 'income' | 'expense';
    category?: string;
  }) => {
    const response = await api.get('/income-expenses', { params: filters });
    return response.data;
  },
  
  create: async (entry: Omit<IncomeExpense, 'id'>) => {
    const response = await api.post('/income-expenses', entry);
    return response.data;
  },
  
  update: async (id: string, entry: Partial<IncomeExpense>) => {
    const response = await api.put(`/income-expenses/${id}`, entry);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/income-expenses/${id}`);
    return response.data;
  },
  
  bulkDelete: async (ids: string[]) => {
    const response = await api.delete('/income-expenses/bulk', {
      data: { ids },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
};

// Income Categories API
export const incomeCategoriesAPI = {
  getAll: async (): Promise<IncomeCategory[]> => {
    const response = await api.get('/income-categories');
    return response.data;
  },
  
  create: async (category: Omit<IncomeCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<IncomeCategory> => {
    const response = await api.post('/income-categories', category);
    return response.data;
  },
  
  update: async (id: string, category: Partial<IncomeCategory>): Promise<IncomeCategory> => {
    const response = await api.put(`/income-categories/${id}`, category);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await api.delete(`/income-categories/${id}`);
    return response.data;
  },
};

// Expense Categories API
export const expenseCategoriesAPI = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get('/expense-categories');
    return response.data;
  },
  
  create: async (category: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseCategory> => {
    const response = await api.post('/expense-categories', category);
    return response.data;
  },
  
  update: async (id: string, category: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const response = await api.put(`/expense-categories/${id}`, category);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  
  create: async (order: Omit<Order, 'id' | 'createdAt'>) => {
    const response = await api.post('/orders', order);
    return response.data;
  },
  
  update: async (id: string, order: Partial<Order>) => {
    const response = await api.put(`/orders/${id}`, order);
    return response.data;
  },
  
  updatePayment: async (
    id: string,
    paymentStatus: 'unpaid' | 'paid',
    paymentMethod?: 'cash' | 'qr',
    discount?: number,
    cashReceived?: number,
    suppressIncome?: boolean
  ) => {
    const response = await api.put(`/orders/${id}/payment`, {
      paymentStatus,
      paymentMethod,
      discount,
      cashReceived,
      suppressIncome
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
  
  bulkDelete: async (ids: string[]) => {
    const response = await api.delete('/orders/bulk', { data: { ids } });
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  
  search: async (phone?: string, memberCard?: string) => {
    const response = await api.get('/customers/search', { 
      params: { phone, memberCard } 
    });
    return response.data;
  },
  
  create: async (customer: Omit<Customer, 'id' | 'loyaltyPoints'>) => {
    const response = await api.post('/customers', customer);
    return response.data;
  },
  
  updatePoints: async (id: string, points: number, operation: 'add' | 'subtract') => {
    const response = await api.put(`/customers/${id}/points`, { points, operation });
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getSalesSummary: async (params: { 
    period?: 'daily' | 'monthly';
    startDate?: string;
    endDate?: string;
    category?: string;
  }) => {
    const response = await api.get('/reports/sales-summary', { params });
    return response.data;
  },

  getTopSellingItems: async (params: {
    period?: 'daily' | 'monthly';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const response = await api.get('/reports/top-selling-items', { params });
    return response.data;
  },

  getIncomeExpenseTrends: async (params: {
    period?: 'daily' | 'monthly';
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }) => {
    const response = await api.get('/reports/income-expense-trends', { params });
    return response.data;
  },

  getOrders: async (params: {
    period?: 'daily' | 'monthly';
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/reports/orders', { params });
    return response.data;
  },

  getDashboard: async (params: {
    period?: 'daily' | 'monthly';
  }) => {
    const response = await api.get('/reports/dashboard', { params });
    return response.data;
  },
};

// Schemas API
export const schemasAPI = {
  get: async (type: 'product' | 'order'): Promise<UserSchema> => {
    const response = await api.get(`/schemas/${type}`);
    return response.data;
  },
  save: async (type: 'product' | 'order', schema: DynamicField[]): Promise<UserSchema> => {
    const response = await api.post(`/schemas/${type}`, { schema });
    return response.data;
  },
};

// Public Order Preview API (no auth required on server; but auth header may still be sent)
export const publicPreviewAPI = {
  get: async (): Promise<{ payload: any; updatedAt?: string }> => {
    const response = await api.get('/public/order-preview');
    return response.data;
  },
  save: async (payload: any): Promise<{ message: string }> => {
    const response = await api.post('/public/order-preview', { payload });
    return response.data;
  },
};

export default api;