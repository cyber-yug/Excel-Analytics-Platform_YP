import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { newAuthAPI, setAccessToken, clearAccessToken, getAccessToken } from '../utils/api';

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_USER':
            return { ...state, user: action.payload, isAuthenticated: !!action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'LOGOUT':
            return { ...state, user: null, isAuthenticated: false, error: null };
        default:
            return state;
    }
};

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const setLoading = (loading) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    };

    const setUser = (user) => {
        dispatch({ type: 'SET_USER', payload: user });
    };

    const setError = (error) => {
        dispatch({ type: 'SET_ERROR', payload: error });
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const checkAuth = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // Check if we have a token first
            const token = getAccessToken();
            if (!token) {
                console.log('🔄 No access token found - user not authenticated');
                dispatch({ type: 'LOGOUT' });
                return;
            }
            
            // Try to get current user info with stored token
            const response = await newAuthAPI.getMe();
            dispatch({ type: 'SET_USER', payload: response.user });
            console.log('✅ User authenticated successfully');
        } catch (error) {
            // No valid token or user not found - clear auth state
            console.log('🔄 Authentication check failed - clearing token');
            dispatch({ type: 'LOGOUT' });
            clearAccessToken();
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);
    
    // Check if user is logged in on app start
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (credentials, rememberMe = false) => {
        try {
            setLoading(true);
            clearError();
            
            console.log('🔐 Starting login process...');
            
            const response = await newAuthAPI.login(
                credentials.emailOrUsername, 
                credentials.password
            );
            
            const { user, message } = response;
            setUser(user);
            
            console.log('✅ Login successful:', message);
            return { success: true, message };
        } catch (error) {
            console.error('❌ Login error:', error);
            const message = error.response?.data?.error || error.message || 'Login failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData, profilePhoto) => {
        try {
            setLoading(true);
            clearError();
            
            console.log('🚀 Starting signup process...', userData);
            
            const response = await newAuthAPI.register(userData);
            
            const { user, message } = response;
            setUser(user);
            
            console.log('✅ Signup successful:', message);
            return { success: true, message };
        } catch (error) {
            console.error('❌ Signup error:', error);
            const message = error.response?.data?.error || error.message || 'Signup failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await newAuthAPI.logout();
            console.log('👋 Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch({ type: 'LOGOUT' });
            clearAccessToken();
        }
    };

    const logoutAll = async () => {
        return logout(); // Same as logout for our simple system
    };

    const updateProfile = async (profileData, profilePhoto) => {
        try {
            setLoading(true);
            clearError();
            
            console.log('📝 Updating profile...', profileData);
            
            const response = await newAuthAPI.updateProfile(profileData, profilePhoto);
            
            // Update the user in context with the new data
            dispatch({ type: 'SET_USER', payload: response.user });
            
            console.log('✅ Profile updated successfully:', response.message);
            return { success: true, message: response.message };
        } catch (error) {
            console.error('❌ Profile update error:', error);
            const message = error.response?.data?.error || error.message || 'Profile update failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            ...state,
            login,
            signup,
            logout,
            logoutAll,
            updateProfile,
            checkAuth,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Protected route component
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public route component (redirect to dashboard if authenticated)
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};
