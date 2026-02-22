import axios from 'axios';
import { getAccessToken } from '../modules/auth/storage';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

