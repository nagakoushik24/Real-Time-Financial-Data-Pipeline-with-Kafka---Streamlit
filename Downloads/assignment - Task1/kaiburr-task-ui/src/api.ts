import axios from 'axios';
import type { Task } from './types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/tasks',
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Disable credentials for CORS
});

// Add request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check if the backend is running');
    }
    if (error.response?.status === 404) {
      throw new Error('Task not found');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data || 'Invalid request');
    }
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error - please check if the backend is running on http://localhost:8080');
    }
    if (error.code === 'ERR_CANCELED') {
      throw new Error('Request was cancelled');
    }
    throw error;
  }
);

export const getTasks = () => apiClient.get<Task[]>('');
export const findTasksByName = (name: string) => apiClient.get<Task[]>('/findByName', { params: { name } });
export const createTask = (task: Task) => apiClient.put<Task>('', task);
export const deleteTask = (id: string) => apiClient.delete('', { params: { id } });
export const executeTask = (taskId: string) => apiClient.put<Task>('/execute', null, { params: { taskId } });
