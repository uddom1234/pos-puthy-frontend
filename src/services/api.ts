import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  stock: number;
  lowStockThreshold: number;
  description: string;
  metadata?: Record<string, any>;
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
  description: string;
  amount: number;
  date: string;
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
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  tableNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface DynamicField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: Array<{ label: string; value: string }>;
}

export interface UserSchema {
  userId: string;
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
};

// Orders API
export const ordersAPI = {
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  
  create: async (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const response = await api.post('/orders', order);
    return response.data;
  },
  
  updateStatus: async (id: string, status: Order['status']) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
  update: async (id: string, order: Partial<Order>) => {
    const response = await api.put(`/orders/${id}`, order);
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
  getSalesSummary: async (period: 'daily' | 'monthly') => {
    const response = await api.get('/reports/sales-summary', { params: { period } });
    return response.data;
  },
};

// Schemas API
export const schemasAPI = {
  get: async (userId: string, type: 'product' | 'order'): Promise<UserSchema> => {
    const response = await api.get(`/schemas/${userId}/${type}`);
    return response.data;
  },
  save: async (userId: string, type: 'product' | 'order', schema: DynamicField[]): Promise<UserSchema> => {
    const response = await api.post(`/schemas/${userId}/${type}`, { schema });
    return response.data;
  },
};

export default api;