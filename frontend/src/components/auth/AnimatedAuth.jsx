import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AnimatedAuth = ({ initialMode = 'login' }) => {
    const [authMode, setAuthMode] = useState(initialMode); // 'login' or 'signup'
    const [animationStage, setAnimationStage] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    
    const { login, signup, loading, error, clearError } = useAuth();
    const navigate = useNavigate();

    // Login form state
    const [loginData, setLoginData] = useState({
        emailOrUsername: '',
        password: '',
        keepLoggedIn: false
    });

    // Signup form state
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        keepLoggedIn: false
    });

    // Animation sequence on component mount
    useEffect(() => {
        const animationSequence = [
            { stage: 0, delay: 0 },      // Initial state
            { stage: 1, delay: 300 },    // Logo appears
            { stage: 3, delay: 800 }     // Form appears
        ];

        animationSequence.forEach(({ stage, delay }) => {
            setTimeout(() => {
                setAnimationStage(stage);
            }, delay);
        });
    }, []);

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 6) errors.push('At least 6 characters');
        if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('One number');
        return errors;
    };

    const handleLoginChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) clearError();
    };

    const handleSignupChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSignupData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) clearError();
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setProfilePhoto(null);
        setPhotoPreview(null);
        document.getElementById('profilePhoto').value = '';
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            await login({
                emailOrUsername: loginData.emailOrUsername,
                password: loginData.password
            }, loginData.keepLoggedIn);
            navigate('/dashboard');
        } catch (error) {
            // Error handled by context
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        
        if (signupData.password !== signupData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const passwordErrors = validatePassword(signupData.password);
        if (passwordErrors.length > 0) {
            alert('Please fix password requirements');
            return;
        }
        
        try {
            const userData = {
                firstName: signupData.firstName,
                lastName: signupData.lastName,
                username: signupData.username,
                email: signupData.email,
                password: signupData.password
            };
            
            await signup(userData, profilePhoto);
            navigate('/dashboard');
        } catch (error) {
            // Error handled by context
        }
    };

    const toggleAuthMode = () => {
        setAuthMode(authMode === 'login' ? 'signup' : 'login');
        if (error) clearError();
    };

    const passwordErrors = validatePassword(signupData.password);

    return (
        <div style={styles.container}>
            {/* Auth Card */}
            <div 
                className="auth-card"
                style={{
                    ...styles.authCard,
                    ...(animationStage >= 3 && styles.bagOpen)
                }}
            >
                {/* Logo Circle at top center of form */}
                <div 
                    className="logo-circle"
                    style={{
                        ...styles.logoCircle,
                        ...(animationStage >= 1 && styles.logoVisible)
                    }}
                >
                    <img 
                        src="/excel_logo.png" 
                        alt="Excel Analytics" 
                        className="logo-image"
                        style={styles.logoImage}
                        onError={(e) => {
                            console.error('Logo image failed to load from /excel_logo.png');
                            // Show fallback text
                            e.target.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.style.cssText = `
                                font-size: 14px;
                                font-weight: 800;
                                color: white;
                                text-align: center;
                                font-family: 'Poppins', sans-serif;
                            `;
                            fallback.innerHTML = 'EA';
                            e.target.parentNode.appendChild(fallback);
                        }}
                    />
                </div>

                {/* Form Mode Toggle */}
                <div style={styles.modeToggle}>
                    <button
                        onClick={() => toggleAuthMode()}
                        style={{
                            ...styles.toggleButton,
                            ...(authMode === 'login' ? styles.toggleButtonActive : {})
                        }}
                        type="button"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => toggleAuthMode()}
                        style={{
                            ...styles.toggleButton,
                            ...(authMode === 'signup' ? styles.toggleButtonActive : {})
                        }}
                        type="button"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Auth Header */}
                <div style={styles.authHeader}>
                    <h1 style={styles.title}>
                        {authMode === 'login' ? 'Welcome Back!' : 'Join Us Today!'}
                    </h1>
                    <p style={styles.subtitle}>
                        {authMode === 'login' 
                            ? 'Sign in to your Excel Analytics account' 
                            : 'Create your Excel Analytics account'
                        }
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {/* Login Form */}
                {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit} style={styles.form}>
                        <div style={styles.formGroup}>
                            <input
                                type="text"
                                name="emailOrUsername"
                                value={loginData.emailOrUsername}
                                onChange={handleLoginChange}
                                placeholder="Email or Username"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    placeholder="Password"
                                    style={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.passwordToggle}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div style={styles.checkboxContainer}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="keepLoggedIn"
                                    checked={loginData.keepLoggedIn}
                                    onChange={handleLoginChange}
                                    style={styles.checkbox}
                                />
                                Keep me logged in
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{
                                ...styles.submitButton,
                                ...(loading ? styles.submitButtonDisabled : {})
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {/* Signup Form */}
                {authMode === 'signup' && (
                    <form onSubmit={handleSignupSubmit} style={styles.form}>
                        {/* Profile Photo Upload */}
                        <div style={styles.photoUploadContainer}>
                            <div style={styles.photoPreview}>
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" style={styles.previewImage} />
                                ) : (
                                    <div style={styles.photoPlaceholder}>📷</div>
                                )}
                            </div>
                            <div style={styles.photoControls}>
                                <label htmlFor="profilePhoto" style={styles.photoUploadButton}>
                                    Choose Photo
                                </label>
                                <input
                                    id="profilePhoto"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={styles.hiddenInput}
                                />
                                {profilePhoto && (
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        style={styles.removePhotoButton}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="name-row" style={styles.nameRow}>
                            <input
                                type="text"
                                name="firstName"
                                value={signupData.firstName}
                                onChange={handleSignupChange}
                                placeholder="First Name"
                                className="half-input"
                                style={{...styles.input, ...styles.halfInput}}
                                required
                            />
                            <input
                                type="text"
                                name="lastName"
                                value={signupData.lastName}
                                onChange={handleSignupChange}
                                placeholder="Last Name"
                                className="half-input"
                                style={{...styles.input, ...styles.halfInput}}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <input
                                type="text"
                                name="username"
                                value={signupData.username}
                                onChange={handleSignupChange}
                                placeholder="Username"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <input
                                type="email"
                                name="email"
                                value={signupData.email}
                                onChange={handleSignupChange}
                                placeholder="Email Address"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={signupData.password}
                                    onChange={handleSignupChange}
                                    placeholder="Password"
                                    style={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.passwordToggle}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {signupData.password && (
                                <div style={styles.passwordRequirements}>
                                    {passwordErrors.map((error, index) => (
                                        <div key={index} style={styles.passwordError}>
                                            ❌ {error}
                                        </div>
                                    ))}
                                    {passwordErrors.length === 0 && (
                                        <div style={styles.passwordSuccess}>
                                            ✅ Password meets all requirements
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={signupData.confirmPassword}
                                    onChange={handleSignupChange}
                                    placeholder="Confirm Password"
                                    style={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.passwordToggle}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                                <div style={styles.passwordError}>
                                    ❌ Passwords do not match
                                </div>
                            )}
                        </div>

                        <div style={styles.checkboxContainer}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="keepLoggedIn"
                                    checked={signupData.keepLoggedIn}
                                    onChange={handleSignupChange}
                                    style={styles.checkbox}
                                />
                                Keep me logged in
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || passwordErrors.length > 0 || signupData.password !== signupData.confirmPassword}
                            style={{
                                ...styles.submitButton,
                                ...((loading || passwordErrors.length > 0 || signupData.password !== signupData.confirmPassword) ? styles.submitButtonDisabled : {})
                            }}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                {/* Form Footer */}
                <div style={styles.formFooter}>
                    <p style={styles.footerText}>
                        {authMode === 'login' 
                            ? "Don't have an account? " 
                            : "Already have an account? "
                        }
                        <button 
                            onClick={toggleAuthMode}
                            style={styles.footerLink}
                            type="button"
                        >
                            {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
                        </button>
                    </p>
                </div>
            </div>

            {/* CSS Animations */}
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                
                /* Logo fade in animation */
                @keyframes logoFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px) scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }

                /* Form appearing animation */
                @keyframes bagOpen {
                    0% {
                        transform: scaleY(0) scaleX(1);
                        opacity: 0;
                        transform-origin: center bottom;
                    }
                    70% {
                        transform: scaleY(1.08) scaleX(1);
                        opacity: 1;
                        transform-origin: center bottom;
                    }
                    100% {
                        transform: scaleY(1) scaleX(1);
                        opacity: 1;
                        transform-origin: center bottom;
                    }
                }

                @keyframes fadeSlide {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Input focus and hover effects */
                input:focus {
                    border-color: rgba(255, 255, 255, 0.6) !important;
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
                    transform: translateY(-1px) !important;
                }

                input:hover {
                    border-color: rgba(255, 255, 255, 0.5) !important;
                }

                input::placeholder {
                    color: rgba(255, 255, 255, 0.7) !important;
                }

                /* Button hover effects */
                button:hover:not(:disabled) {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6) !important;
                }

                button:active:not(:disabled) {
                    transform: translateY(0) !important;
                }

                /* Gradient Animation Keyframes */
                @keyframes gradientShift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }

                /* Responsive Design */
                @media (max-width: 480px) {
                    .auth-card {
                        min-width: auto !important;
                        margin: 10px !important;
                        padding: 50px 20px 30px 20px !important;
                    }
                    
                    .name-row {
                        flex-direction: column !important;
                        gap: 20px !important;
                    }
                    
                    .half-input {
                        width: 100% !important;
                    }
                    
                    .logo-circle {
                        width: 60px !important;
                        height: 60px !important;
                        top: -30px !important;
                    }
                    
                    .logo-image {
                        height: 45px !important;
                        width: 45px !important;
                        transform: scale(1.1) !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #8B5CF6 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
    },
    logoCircle: {
        position: 'absolute',
        top: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80px',
        height: '80px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        opacity: 0,
        transition: 'all 0.8s ease-out',
        zIndex: 10,
        overflow: 'hidden'
    },
    logoVisible: {
        opacity: 1,
        animation: 'logoFadeIn 0.8s ease-out forwards'
    },
    logoImage: {
        height: '60px',
        width: '60px',
        objectFit: 'cover',
        objectPosition: 'center',
        borderRadius: '50%',
        transform: 'scale(1.2)',
        filter: 'contrast(1.1) saturate(1.1)'
    },
    authCard: {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '60px 40px 40px 40px', // Extra top padding for logo space
        width: '100%',
        maxWidth: '450px',
        minWidth: '350px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        color: 'white',
        opacity: 0,
        transformOrigin: 'center bottom',
        zIndex: 3,
        boxSizing: 'border-box',
        position: 'relative'
    },
    bagOpen: {
        animation: 'bagOpen 1.2s ease-out forwards'
    },
    modeToggle: {
        display: 'flex',
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '4px'
    },
    toggleButton: {
        flex: 1,
        padding: '12px',
        border: 'none',
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.7)',
        borderRadius: '8px',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    toggleButtonActive: {
        background: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        transform: 'scale(1.02)'
    },
    authHeader: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0 0 8px 0',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    subtitle: {
        fontSize: '16px',
        fontWeight: '300',
        margin: 0,
        opacity: 0.9
    },
    errorMessage: {
        background: 'rgba(255, 107, 107, 0.9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    input: {
        padding: '16px 20px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontSize: '16px',
        fontFamily: "'Poppins', sans-serif",
        outline: 'none',
        transition: 'all 0.3s ease',
        '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)'
        },
        '&:focus': {
            borderColor: 'rgba(255, 255, 255, 0.6)',
            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-1px)'
        },
        '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.5)'
        }
    },
    passwordContainer: {
        position: 'relative'
    },
    passwordToggle: {
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.7)',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px'
    },
    nameRow: {
        display: 'flex',
        gap: '12px',
        width: '100%'
    },
    halfInput: {
        flex: 1,
        minWidth: '0' // This ensures the input can shrink properly
    },
    checkboxContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.9)',
        cursor: 'pointer'
    },
    checkbox: {
        width: '18px',
        height: '18px',
        accentColor: '#516bfe'
    },
    submitButton: {
        padding: '16px 24px',
        background: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
        marginTop: '10px',
        '&:hover:not(:disabled)': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(255, 107, 107, 0.6)'
        },
        '&:active:not(:disabled)': {
            transform: 'translateY(0)'
        }
    },
    submitButtonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
        transform: 'none'
    },
    formFooter: {
        textAlign: 'center',
        marginTop: '20px'
    },
    footerText: {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.8)',
        margin: 0
    },
    footerLink: {
        color: '#ff6b6b',
        fontWeight: '500',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: "'Poppins', sans-serif"
    },
    photoUploadContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '10px'
    },
    photoPreview: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.3)'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    photoPlaceholder: {
        fontSize: '24px',
        opacity: 0.7
    },
    photoControls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    photoUploadButton: {
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        fontFamily: "'Poppins', sans-serif",
        cursor: 'pointer',
        textAlign: 'center'
    },
    removePhotoButton: {
        padding: '4px 12px',
        background: 'rgba(255, 107, 107, 0.3)',
        border: '1px solid rgba(255, 107, 107, 0.5)',
        borderRadius: '6px',
        color: 'white',
        fontSize: '10px',
        fontFamily: "'Poppins', sans-serif",
        cursor: 'pointer'
    },
    hiddenInput: {
        display: 'none'
    },
    passwordRequirements: {
        fontSize: '12px',
        marginTop: '4px'
    },
    passwordError: {
        color: '#ff6b6b',
        marginBottom: '2px'
    },
    passwordSuccess: {
        color: '#51cf66'
    }
};

export default AnimatedAuth;
