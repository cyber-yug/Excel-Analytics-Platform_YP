import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const Profile = () => {
    const { user, updateProfile, changePassword, loading, error, clearError } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);
    
    // Profile form state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        username: user?.username || ''
    });
    
    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // Photo upload state
    const [newPhoto, setNewPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 6) errors.push('At least 6 characters');
        if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('One number');
        return errors;
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) clearError();
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) clearError();
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            
            setNewPhoto(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target.result);
            reader.readAsDataURL(file);
            
            toast.success('Photo selected successfully');
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        const toastId = toast.loading('Updating profile...');
        
        try {
            await updateProfile(profileData, newPhoto);
            setNewPhoto(null);
            setPhotoPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            toast.success('Profile updated successfully!', { id: toastId });
        } catch (error) {
            toast.error(error.message || 'Failed to update profile', { id: toastId });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        
        const passwordErrors = validatePassword(passwordData.newPassword);
        if (passwordErrors.length > 0) {
            toast.error('Password must meet all requirements');
            return;
        }
        
        const toastId = toast.loading('Changing password...');
        
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            toast.success('Password changed successfully! You will be logged out from all devices.', { 
                id: toastId,
                duration: 5000 
            });
        } catch (error) {
            toast.error(error.message || 'Failed to change password', { id: toastId });
        }
    };

    const removePhoto = () => {
        setNewPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Photo removed');
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getCurrentPhotoUrl = () => {
        if (photoPreview) return photoPreview;
        if (user?.profilePhoto?.url) return user.profilePhoto.url;
        return null;
    };

    return (
        <>
            <div style={styles.container}>
                <div style={styles.maxWidth}>
                    <div style={styles.card}>
                        {/* Header */}
                        <div style={styles.header}>
                        <h1 style={styles.title}>Profile Settings</h1>
                        <p style={styles.subtitle}>
                            Manage your account settings and preferences
                        </p>
                    </div>

                    {/* Tabs */}
                    <div style={styles.tabsContainer}>
                        <nav style={styles.tabsNav}>
                            <button
                                onClick={() => setActiveTab('profile')}
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'profile' ? styles.tabButtonActive : styles.tabButtonInactive)
                                }}
                            >
                                Profile Information
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'password' ? styles.tabButtonActive : styles.tabButtonInactive)
                                }}
                            >
                                Password & Security
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div style={styles.content}>
                        {error && (
                            <div style={styles.errorAlert}>
                                {error}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit} style={styles.form}>
                                {/* Profile Photo */}
                                <div>
                                    <label style={styles.label}>
                                        Profile Photo
                                    </label>
                                    <div style={styles.photoContainer}>
                                        <div style={styles.photoWrapper}>
                                            {getCurrentPhotoUrl() ? (
                                                <img 
                                                    src={getCurrentPhotoUrl()} 
                                                    alt="Profile" 
                                                    style={styles.photoImage}
                                                />
                                            ) : (
                                                <span style={styles.photoPlaceholder}>👤</span>
                                            )}
                                        </div>
                                        <div style={styles.photoControls}>
                                            <label 
                                                htmlFor="profilePhoto" 
                                                style={styles.photoButton}
                                            >
                                                Change Photo
                                            </label>
                                            <input
                                                ref={fileInputRef}
                                                id="profilePhoto"
                                                type="file"
                                                style={styles.hiddenInput}
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                            />
                                            {(newPhoto || user?.profilePhoto?.url) && (
                                                <button
                                                    type="button"
                                                    onClick={removePhoto}
                                                    style={styles.removeButton}
                                                >
                                                    Remove Photo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Name Fields */}
                                <div style={styles.gridTwo}>
                                    <div>
                                        <label htmlFor="firstName" style={styles.label}>
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleProfileChange}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" style={styles.label}>
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleProfileChange}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                {/* Username and Email */}
                                <div style={styles.gridTwo}>
                                    <div>
                                        <label htmlFor="username" style={styles.label}>
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={profileData.username}
                                            onChange={handleProfileChange}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" style={styles.label}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                {/* Account Info */}
                                <div style={styles.accountInfo}>
                                    <h3 style={styles.accountInfoTitle}>Account Information</h3>
                                    <div style={styles.accountInfoContent}>
                                        <p style={styles.accountInfoItem}>
                                            <span style={styles.accountInfoLabel}>Role:</span> {user?.role || 'User'}
                                        </p>
                                        <p style={styles.accountInfoItem}>
                                            <span style={styles.accountInfoLabel}>Member since:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <p style={styles.accountInfoItem}>
                                            <span style={styles.accountInfoLabel}>Last updated:</span> {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div style={styles.buttonContainer}>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            ...styles.submitButton,
                                            ...(loading ? styles.submitButtonDisabled : {})
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit} style={styles.form}>
                                <div>
                                    <label htmlFor="currentPassword" style={styles.label}>
                                        Current Password
                                    </label>
                                    <div style={styles.passwordContainer}>
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            style={styles.passwordInput}
                                        />
                                        <button
                                            type="button"
                                            style={styles.passwordToggle}
                                            onClick={() => togglePasswordVisibility('current')}
                                        >
                                            {showPasswords.current ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="newPassword" style={styles.label}>
                                        New Password
                                    </label>
                                    <div style={styles.passwordContainer}>
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            style={styles.passwordInput}
                                        />
                                        <button
                                            type="button"
                                            style={styles.passwordToggle}
                                            onClick={() => togglePasswordVisibility('new')}
                                        >
                                            {showPasswords.new ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    
                                    {/* Password requirements */}
                                    {passwordData.newPassword && (
                                        <div style={styles.passwordRequirements}>
                                            {validatePassword(passwordData.newPassword).map((error, index) => (
                                                <div key={index} style={styles.passwordError}>
                                                    ❌ {error}
                                                </div>
                                            ))}
                                            {validatePassword(passwordData.newPassword).length === 0 && (
                                                <div style={styles.passwordSuccess}>✅ Password meets all requirements</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" style={styles.label}>
                                        Confirm New Password
                                    </label>
                                    <div style={styles.passwordContainer}>
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            style={styles.passwordInput}
                                        />
                                        <button
                                            type="button"
                                            style={styles.passwordToggle}
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        >
                                            {showPasswords.confirm ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <div style={styles.passwordMismatch}>
                                            Passwords do not match
                                        </div>
                                    )}
                                </div>

                                <div style={styles.securityNotice}>
                                    <div style={styles.securityNoticeContent}>
                                        <h3 style={styles.securityNoticeTitle}>
                                            Security Notice
                                        </h3>
                                        <div style={styles.securityNoticeText}>
                                            <ul style={styles.securityNoticeList}>
                                                <li>Choose a strong password you haven't used elsewhere</li>
                                                <li>Changing your password will log you out of all devices</li>
                                                <li>You'll need to log in again with your new password</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.buttonContainer}>
                                    <button
                                        type="submit"
                                        disabled={loading || validatePassword(passwordData.newPassword).length > 0 || passwordData.newPassword !== passwordData.confirmPassword}
                                        style={{
                                            ...styles.submitButton,
                                            ...((loading || validatePassword(passwordData.newPassword).length > 0 || passwordData.newPassword !== passwordData.confirmPassword) ? styles.submitButtonDisabled : {})
                                        }}
                                    >
                                        {loading ? 'Changing Password...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <Toaster 
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#fff',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff'
                    }
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff'
                    }
                }
            }}
        />
        </>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: '#f9fafb',
        padding: '48px 16px',
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    },
    maxWidth: {
        maxWidth: '768px',
        margin: '0 auto'
    },
    card: {
        background: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid #e5e7eb'
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 4px 0'
    },
    subtitle: {
        margin: '0',
        fontSize: '14px',
        color: '#6b7280'
    },
    tabsContainer: {
        borderBottom: '1px solid #e5e7eb'
    },
    tabsNav: {
        display: 'flex',
        marginBottom: '-1px',
        paddingLeft: '24px',
        gap: '32px'
    },
    tabButton: {
        padding: '16px 4px',
        border: 'none',
        background: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s ease'
    },
    tabButtonActive: {
        borderBottomColor: '#6366f1',
        color: '#6366f1'
    },
    tabButtonInactive: {
        color: '#6b7280',
        ':hover': {
            color: '#374151',
            borderBottomColor: '#d1d5db'
        }
    },
    content: {
        padding: '24px'
    },
    errorAlert: {
        marginBottom: '24px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#b91c1c',
        padding: '12px 16px',
        borderRadius: '6px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '4px'
    },
    input: {
        marginTop: '4px',
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    gridTwo: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
    },
    photoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
    },
    photoWrapper: {
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        border: '2px solid #d1d5db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#f9fafb'
    },
    photoImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    photoPlaceholder: {
        color: '#9ca3af',
        fontSize: '32px'
    },
    photoControls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    photoButton: {
        cursor: 'pointer',
        background: 'white',
        padding: '8px 16px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
        transition: 'all 0.2s ease'
    },
    hiddenInput: {
        display: 'none'
    },
    removeButton: {
        fontSize: '14px',
        color: '#dc2626',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        padding: '0'
    },
    accountInfo: {
        background: '#f9fafb',
        padding: '16px',
        borderRadius: '6px'
    },
    accountInfoTitle: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#111827',
        margin: '0 0 8px 0'
    },
    accountInfoContent: {
        fontSize: '14px',
        color: '#6b7280',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    accountInfoItem: {
        margin: '0'
    },
    accountInfoLabel: {
        fontWeight: '500'
    },
    passwordContainer: {
        marginTop: '4px',
        position: 'relative'
    },
    passwordInput: {
        display: 'block',
        width: '100%',
        padding: '8px 40px 8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    passwordToggle: {
        position: 'absolute',
        top: '50%',
        right: '12px',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px'
    },
    passwordRequirements: {
        marginTop: '8px',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    passwordError: {
        color: '#dc2626'
    },
    passwordSuccess: {
        color: '#16a34a'
    },
    passwordMismatch: {
        marginTop: '4px',
        fontSize: '12px',
        color: '#dc2626'
    },
    securityNotice: {
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '6px',
        padding: '16px'
    },
    securityNoticeContent: {
        marginLeft: '12px'
    },
    securityNoticeTitle: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#92400e',
        margin: '0 0 8px 0'
    },
    securityNoticeText: {
        fontSize: '14px',
        color: '#b45309'
    },
    securityNoticeList: {
        margin: '0',
        paddingLeft: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    submitButton: {
        background: '#6366f1',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none'
    },
    submitButtonDisabled: {
        opacity: '0.5',
        cursor: 'not-allowed'
    }
};

export default Profile;
