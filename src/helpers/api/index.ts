import axios from 'axios';
import { userManager } from '../auth';
import biocollectApi from './endpoints/biocollect';

// Include cookies across requests to backend API
axios.defaults.withCredentials = true;

axios.interceptors.request.use(async (config) => {
  config.withCredentials = true;
  const user = await userManager.getUser();

  // Add the authorization header if the user has an active session token
  if (user && user.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`;
  }

  return config;
});

export const biocollect = biocollectApi();
