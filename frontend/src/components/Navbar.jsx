import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Upload, FileText, Home, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/history', icon: FileText, label: 'History' }
  ];

  return (
      <nav className="navbar-bg">
        <div className="navbar-container">
          <div className="navbar-brand">
            <BarChart3 size={24} />
            <span>Excel Analytics</span>
          </div>
          
          {/* Only show navigation items when authenticated */}
          {isAuthenticated && (
            <ul className="navbar-list">
              {navItems.map(({ path, icon: Icon, label }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={`navbar-link${location.pathname === path ? ' navbar-link-active' : ''}`}
                  >
                    <Icon size={20} className="navbar-link-icon" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* User menu */}
          <div className="navbar-user">
            {isAuthenticated ? (
              <div className="navbar-user-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="navbar-user-button"
                >
                  <div className="navbar-user-avatar">
                    {user?.profilePhoto?.url ? (
                      <img
                        src={user.profilePhoto.url}
                        alt="Profile"
                        className="navbar-user-image"
                      />
                    ) : (
                      <span className="navbar-user-initials">
                        {getInitials(user?.firstName, user?.lastName)}
                      </span>
                    )}
                  </div>
                  <div className="navbar-user-info">
                    <div className="navbar-user-name">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="navbar-user-username">
                      @{user?.username}
                    </div>
                  </div>
                </button>

                {/* Profile dropdown */}
                {isProfileDropdownOpen && (
                  <>
                    <div
                      className="navbar-dropdown-overlay"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div className="navbar-dropdown-menu">
                      <div className="navbar-dropdown-header">
                        <div className="navbar-dropdown-name">{user?.firstName} {user?.lastName}</div>
                        <div className="navbar-dropdown-email">{user?.email}</div>
                      </div>
                      <Link
                        to="/profile"
                        className="navbar-dropdown-item"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Settings size={16} />
                        <span>Profile Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="navbar-dropdown-item navbar-dropdown-logout"
                      >
                        <LogOut size={16} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Only show login/signup when not authenticated and not on auth pages
              !location.pathname.includes('/login') && !location.pathname.includes('/signup') && (
                <div className="navbar-auth-buttons">
                  <Link to="/login" className="navbar-auth-link">
                    Sign in
                  </Link>
                  <Link to="/signup" className="navbar-auth-button">
                    Sign up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </nav>
  );
};

export default Navbar;
