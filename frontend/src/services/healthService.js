import { apiRequest } from './api';

export const healthService = {
  getHealth: async () => {
    return await apiRequest('/health');
  },
  getDatabaseHealth: async () => {
    return await apiRequest('/health/db');
  }
};
