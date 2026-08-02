/**
 * api/client.js
 *
 * Thin wrapper around axios for all backend API calls.
 * - Sets the base URL from the VITE_API_BASE_URL env variable
 * - Sends cookies with every request (withCredentials: true) — required for httpOnly JWT cookies
 * - Centralizes error handling
 */
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true, // send/receive httpOnly cookies on cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — unwraps data and normalizes errors
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default client;
