
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, BarChart3, FileText, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRows: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/upload/files');
      const files = response.data.files;
      
      const totalRows = files.reduce((sum, file) => sum + file.rowCount, 0);
      
      setStats({
        totalFiles: files.length,
        totalRows,
        recentFiles: files.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-bg">
        <div className="dashboard-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Excel Analytics Dashboard</h1>
        <p className="dashboard-subtitle">Analyze your Excel data with powerful visualizations and insights</p>
        <div className="dashboard-summary">
          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              <FileText size={32} />
            </div>
            <div>
              <div className="dashboard-card-value">{stats.totalFiles}</div>
              <div className="dashboard-card-label">Files Uploaded</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              <TrendingUp size={32} />
            </div>
            <div>
              <div className="dashboard-card-value">{stats.totalRows.toLocaleString()}</div>
              <div className="dashboard-card-label">Total Rows Processed</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              <BarChart3 size={32} />
            </div>
            <div>
              <div className="dashboard-card-value">{stats.recentFiles.length}</div>
              <div className="dashboard-card-label">Recent Analyses</div>
            </div>
          </div>
        </div>
        <h2 className="dashboard-actions-title">Quick Actions</h2>
        <div className="dashboard-actions">
          <Link to="/upload" className="dashboard-action-card">
            <Upload size={48} className="dashboard-action-icon" />
            <div className="dashboard-action-label">Upload New File</div>
            <div className="dashboard-action-desc">Upload Excel or CSV files for analysis</div>
          </Link>
          <Link to="/analytics" className="dashboard-action-card">
            <BarChart3 size={48} className="dashboard-action-icon" />
            <div className="dashboard-action-label">Create Charts</div>
            <div className="dashboard-action-desc">Generate interactive charts and visualizations</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
