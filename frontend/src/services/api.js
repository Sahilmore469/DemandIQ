import axios from 'axios';

// Create API client with base URL pointing to FastAPI backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Dashboard
  getDashboard: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },

  // Products
  getProducts: async () => {
    const res = await apiClient.get('/products');
    return res.data;
  },

  getProductDetail: async (stockCode) => {
    const res = await apiClient.get(`/products/${encodeURIComponent(stockCode)}`);
    return res.data;
  },

  getProductHistory: async (stockCode, limit = null) => {
    const params = limit ? { limit } : {};
    const res = await apiClient.get(`/products/${encodeURIComponent(stockCode)}/history`, { params });
    return res.data;
  },

  // Models
  getModels: async () => {
    const res = await apiClient.get('/models');
    return res.data;
  },

  getModelMetrics: async () => {
    const res = await apiClient.get('/model-metrics');
    return res.data;
  },

  // Forecast
  createForecast: async ({ stock_code, model_name, horizon = 14 }) => {
    const res = await apiClient.post('/forecast', {
      stock_code: String(stock_code),
      model_name: String(model_name),
      horizon: Number(horizon),
    });
    return res.data;
  },
};

export default api;
