import axios from 'axios';
import { getStoredToken } from '../auth/client';
import biocollectApi from './endpoints/biocollect';

// Include cookies across requests to backend API
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 60s timeout to handle Render cold starts gracefully

axios.interceptors.request.use((config) => {
  config.withCredentials = true;
  const token = getStoredToken();

  // Add the authorization header if an active session token is present
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const biocollect = biocollectApi();
