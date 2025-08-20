import axios from 'axios';

// Environment-based API URL configuration
const getApiBaseUrl = () => {
    // Check if we're in production (Vercel)
    if (import.meta.env.PROD) {
        return '/api';
    }
    
    // Development - use environment variable or fallback to localhost
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

// Create axios instance with correct port
const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    timeout: 10000
});

console.log('🌐 API Base URL:', getApiBaseUrl());
console.log('🏗️ Environment:', import.meta.env.PROD ? 'Production' : 'Development');

// Token storage with localStorage persistence
let accessToken = localStorage.getItem('accessToken');

// Set access token
export const setAccessToken = (token) => {
    accessToken = token;
    if (token) {
        localStorage.setItem('accessToken', token);
        console.log('✅ Access token set and saved');
    } else {
        localStorage.removeItem('accessToken');
    }
};

// Get access token
export const getAccessToken = () => {
    return accessToken || localStorage.getItem('accessToken');
};

// Clear access token
export const clearAccessToken = () => {
    accessToken = null;
    localStorage.removeItem('accessToken');
    console.log('🗑️ Access token cleared');
};

// Request interceptor to add auth header
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('🔒 Unauthorized - clearing token');
            clearAccessToken();
        }
        return Promise.reject(error);
    }
);

// New simplified auth API
export const newAuthAPI = {
    // Register user
    register: async (userData) => {
        try {
            console.log('🚀 Registering user...', userData);
            const response = await api.post('/user/register', userData);
            
            if (response.data.token) {
                setAccessToken(response.data.token);
            }
            
            console.log('✅ Registration successful');
            return response.data;
        } catch (error) {
            console.error('❌ Registration failed:', error.response?.data || error.message);
            throw error;
        }
    },

    // Login user
    login: async (emailOrUsername, password) => {
        try {
            console.log('🔐 Logging in user...');
            const response = await api.post('/user/login', {
                emailOrUsername,
                password
            });
            
            if (response.data.token) {
                setAccessToken(response.data.token);
            }
            
            console.log('✅ Login successful');
            return response.data;
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get current user
    getMe: async () => {
        try {
            const response = await api.get('/user/me');
            return response.data;
        } catch (error) {
            console.error('❌ Get user failed:', error.response?.data || error.message);
            throw error;
        }
    },

    // Update user profile
    updateProfile: async (profileData, profilePhoto) => {
        try {
            console.log('📝 Updating user profile...');
            
            const formData = new FormData();
            
            // Add profile data to form
            if (profileData.firstName) formData.append('firstName', profileData.firstName);
            if (profileData.lastName) formData.append('lastName', profileData.lastName);
            if (profileData.username) formData.append('username', profileData.username);
            if (profileData.email) formData.append('email', profileData.email);
            
            // Add profile photo if provided
            if (profilePhoto) {
                formData.append('profilePhoto', profilePhoto);
            }
            
            const response = await api.put('/user/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            console.log('✅ Profile updated successfully');
            return response.data;
        } catch (error) {
            console.error('❌ Profile update failed:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get all users (for testing)
    getAllUsers: async () => {
        try {
            const response = await api.get('/user/all');
            return response.data;
        } catch (error) {
            console.error('❌ Get all users failed:', error.response?.data || error.message);
            throw error;
        }
    },

    // Logout (just clear token)
    logout: () => {
        clearAccessToken();
        console.log('👋 Logged out successfully');
        return Promise.resolve({ success: true, message: 'Logged out successfully' });
    }
};

// Health check
export const healthCheck = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        throw error;
    }
};

export default api;
