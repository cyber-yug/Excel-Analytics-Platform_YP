import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, Cloud, Zap, Shield, BarChart3 } from 'lucide-react';
import axios from 'axios';
import './Upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect({ target: { files: [droppedFile] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading file:', file.name);
      const response = await axios.post('http://192.168.1.21:3001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);
      setUploadResult(response.data);
      
      // Auto-navigate to analytics after 2 seconds
      setTimeout(() => {
        navigate(`/analytics/${response.data.fileId}`);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response) {
        // Server responded with error status
        setError(error.response.data?.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        // Something else happened
        setError(error.message || 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1>Upload Your Excel File</h1>
        <p>Transform your data into powerful insights with our advanced analytics platform</p>
      </div>

      <div className="upload-container">
        <div 
          className={`upload-area ${file ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            id="file-input"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden-input"
          />
          
          <label htmlFor="file-input" className="upload-label">
            {file ? (
              <div className="file-preview">
                <div className="file-icon">
                  <FileText size={64} />
                </div>
                <div className="file-info">
                  <h3>{file.name}</h3>
                  <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="upload-icon">
                  <Cloud size={80} />
                </div>
                <div className="upload-text">
                  <h3>Drop your file here or click to browse</h3>
                  <p>Supports Excel (.xlsx, .xls) and CSV files up to 100MB</p>
                </div>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="success-message">
            <CheckCircle size={20} />
            <div className="success-content">
              <h4>Upload Successful!</h4>
              <p>
                Processed {uploadResult.metadata.rows} rows and {uploadResult.metadata.columns} columns
              </p>
              <p className="redirect-text">Redirecting to analytics...</p>
            </div>
          </div>
        )}

        {file && !uploadResult && (
          <div className="upload-button-container">
            <button 
              className="upload-btn"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <span className="uploading">
                  <div className="spinner"></div>
                  Uploading...
                </span>
              ) : (
                <span className="upload-ready">
                  <Zap size={20} />
                  Upload & Analyze
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="features-section">
        <h3>Why Choose Our Platform?</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart3 size={48} />
            </div>
            <h4>Smart Analytics</h4>
            <p>Automatically detect patterns and generate meaningful insights from your data</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={48} />
            </div>
            <h4>Lightning Fast</h4>
            <p>Process thousands of rows in seconds with our optimized data engine</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={48} />
            </div>
            <h4>Secure & Private</h4>
            <p>Your data is encrypted and stored securely with enterprise-grade protection</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Cloud size={48} />
            </div>
            <h4>Cloud Powered</h4>
            <p>Access your analytics from anywhere with our cloud-based infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
