// src/api/index.ts

import axios from 'axios';
import { logger } from '../lib/logger';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    logger.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
      params: config.params,
    });
    return config;
  },
  (error) => {
    logger.error('API Request Error', {
      error: error.message,
      stack: error.stack,
    });
    return Promise.reject(error);
  }
);

// Response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    logger.debug('API Response Success', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.data,
    });
    return response;
  },
  (error) => {
    const errorData = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      response: error.response?.data,
      stack: error.stack,
    };

    logger.logApiError(
      error.config?.url || 'unknown',
      error.config?.method?.toUpperCase() || 'unknown',
      error.response?.status || 0,
      error.response?.data
    );

    return Promise.reject(error);
  }
);

export default apiClient;