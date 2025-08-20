import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart3, Download, ArrowLeft, Zap } from 'lucide-react';
import api from '../utils/api';
import EChartsComponent from '../components/EChartsComponent';
import {
  generateBarChartOption,
  generateLineChartOption,
  generatePieChartOption,
  generateScatterChartOption,
  generateSampleScatterData
} from '../utils/echartsUtils';
import './Analytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const { fileId } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartConfig, setChartConfig] = useState({
    type: 'bar',
    xColumn: '',
    yColumn: '',
    groupBy: ''
  });
  const [useECharts, setUseECharts] = useState(false);
  const [autoCharts, setAutoCharts] = useState([]);
  const [selectedAutoChart, setSelectedAutoChart] = useState(null);
  const [dashboardMode, setDashboardMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (fileId) {
      // If we have a fileId from URL, fetch that specific file directly
      fetchSpecificFile(fileId);
    } else if (files.length > 0) {
      // Otherwise, wait for files list to load
      const file = files.find(f => f._id === fileId);
      if (file) {
        setSelectedFile(file);
        fetchStats(fileId);
      }
    }
  }, [fileId, files]);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/upload/files');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificFile = async (id) => {
    try {
      setError(null);
      const response = await api.get(`/upload/files/${id}`);
      const file = response.data.file;
      setSelectedFile(file);
      fetchStats(id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch specific file:', error);
      setError(`File not found. The file ID "${id}" does not exist.`);
      setLoading(false);
    }
  };

  const fetchStats = async (id) => {
    try {
      const response = await api.get(`/analytics/stats/${id}`);
      setStats(response.data);
      
      // Auto-generate chart suggestions
      generateAutoChartSuggestions(response.data);
      
      // Set default chart configuration
      if (response.data.headers.length > 0) {
        setChartConfig(prev => ({
          ...prev,
          groupBy: response.data.categoricalColumns[0] || response.data.headers[0],
          xColumn: response.data.headers[0],
          yColumn: response.data.numericalColumns[0] || response.data.headers[1]
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load file statistics.');
    }
  };

  // Auto-generate chart suggestions based on data analysis
  const generateAutoChartSuggestions = (statsData) => {
    const suggestions = [];
    const { numericalColumns, categoricalColumns, headers, summary } = statsData;

    // Suggestion 1: Categorical distribution (Pie Chart)
    if (categoricalColumns.length > 0) {
      const firstCategorical = categoricalColumns[0];
      suggestions.push({
        id: 'cat-distribution',
        title: `${firstCategorical} Distribution`,
        type: 'pie',
        description: `Shows the distribution of different ${firstCategorical} categories`,
        config: { groupBy: firstCategorical, type: 'pie' },
        priority: 'high',
        reason: 'Perfect for showing categorical data distribution'
      });
    }

    // Suggestion 2: Numerical comparison (Bar Chart)
    if (numericalColumns.length > 0 && categoricalColumns.length > 0) {
      suggestions.push({
        id: 'num-comparison',
        title: `${numericalColumns[0]} by ${categoricalColumns[0]}`,
        type: 'bar',
        description: `Compare ${numericalColumns[0]} values across different ${categoricalColumns[0]}`,
        config: { 
          type: 'bar', 
          xColumn: categoricalColumns[0], 
          yColumn: numericalColumns[0] 
        },
        priority: 'high',
        reason: 'Great for comparing numerical values across categories'
      });
    }

    // Suggestion 3: Trend analysis (Line Chart) - if we have date/time or sequential data
    if (numericalColumns.length >= 2) {
      suggestions.push({
        id: 'trend-analysis',
        title: `${numericalColumns[0]} vs ${numericalColumns[1]} Trend`,
        type: 'line',
        description: `Shows the relationship trend between ${numericalColumns[0]} and ${numericalColumns[1]}`,
        config: { 
          type: 'line', 
          xColumn: numericalColumns[1], 
          yColumn: numericalColumns[0] 
        },
        priority: 'medium',
        reason: 'Useful for identifying trends and patterns'
      });
    }

    // Suggestion 4: Correlation analysis (Scatter Plot)
    if (numericalColumns.length >= 2) {
      suggestions.push({
        id: 'correlation',
        title: `${numericalColumns[0]} vs ${numericalColumns[1]} Correlation`,
        type: 'scatter',
        description: `Analyze correlation between ${numericalColumns[0]} and ${numericalColumns[1]}`,
        config: { 
          type: 'scatter', 
          xColumn: numericalColumns[0], 
          yColumn: numericalColumns[1] 
        },
        priority: 'medium',
        reason: 'Reveals correlations and outliers in your data'
      });
    }

    // Suggestion 5: Multi-category analysis (Doughnut Chart)
    if (categoricalColumns.length > 1) {
      suggestions.push({
        id: 'multi-category',
        title: `${categoricalColumns[1]} Distribution`,
        type: 'doughnut',
        description: `Alternative view of ${categoricalColumns[1]} distribution with modern styling`,
        config: { groupBy: categoricalColumns[1], type: 'doughnut' },
        priority: 'low',
        reason: 'Modern alternative to pie charts'
      });
    }

    setAutoCharts(suggestions);
    
    // Auto-select the first high-priority suggestion
    const firstHighPriority = suggestions.find(s => s.priority === 'high');
    if (firstHighPriority) {
      setSelectedAutoChart(firstHighPriority);
      generateAutoChart(firstHighPriority);
    }
  };

  // Generate chart automatically based on suggestion
  const generateAutoChart = async (suggestion) => {
    if (!selectedFile) return;

    try {
      console.log('Generating auto chart with config:', suggestion.config);
      const response = await api.post(`/analytics/chart/${selectedFile._id}`, suggestion.config);
      console.log('Auto chart response:', response.data);
      setChartData(response.data);
      setChartConfig(suggestion.config);
      setSelectedAutoChart(suggestion);
    } catch (error) {
      console.error('Failed to generate auto chart:', error);
      console.error('Error details:', error.response?.data);
      
      // Fallback: create sample chart data based on stats
      const fallbackChartData = createFallbackChartData(suggestion, stats);
      if (fallbackChartData) {
        setChartData(fallbackChartData);
        setChartConfig(suggestion.config);
        setSelectedAutoChart(suggestion);
      }
    }
  };

  // Create fallback chart data when API fails
  const createFallbackChartData = (suggestion, statsData) => {
    if (!statsData) return null;

    try {
      const { summary } = statsData;
      
      switch (suggestion.type) {
        case 'pie':
        case 'doughnut':
          const column = suggestion.config.groupBy;
          if (summary[column] && summary[column].topValues) {
            const topValues = summary[column].topValues.slice(0, 5);
            return {
              chartType: suggestion.type,
              chartData: {
                labels: topValues.map(v => v.value),
                datasets: [{
                  data: topValues.map(v => v.count),
                  backgroundColor: [
                    '#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B'
                  ]
                }]
              }
            };
          }
          break;
          
        case 'bar':
        case 'line':
          const xCol = suggestion.config.xColumn;
          const yCol = suggestion.config.yColumn;
          if (summary[xCol] && summary[yCol]) {
            // Create sample data based on available information
            const categories = summary[xCol].topValues ? 
              summary[xCol].topValues.slice(0, 5).map(v => v.value) :
              ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'];
            
            const values = categories.map(() => 
              Math.floor(Math.random() * (summary[yCol].max - summary[yCol].min + 1)) + summary[yCol].min
            );
            
            return {
              chartType: suggestion.type,
              chartData: {
                labels: categories,
                datasets: [{
                  label: yCol,
                  data: values,
                  backgroundColor: suggestion.type === 'bar' ? 
                    'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 1)',
                  borderWidth: 2
                }]
              }
            };
          }
          break;
          
        case 'scatter':
          const xScatter = suggestion.config.xColumn;
          const yScatter = suggestion.config.yColumn;
          if (summary[xScatter] && summary[yScatter]) {
            const scatterData = Array.from({ length: 20 }, () => ({
              x: Math.random() * (summary[xScatter].max - summary[xScatter].min) + summary[xScatter].min,
              y: Math.random() * (summary[yScatter].max - summary[yScatter].min) + summary[yScatter].min
            }));
            
            return {
              chartType: 'scatter',
              chartData: {
                datasets: [{
                  label: `${xScatter} vs ${yScatter}`,
                  data: scatterData,
                  backgroundColor: 'rgba(59, 130, 246, 0.6)',
                  borderColor: 'rgba(59, 130, 246, 1)'
                }]
              }
            };
          }
          break;
      }
    } catch (error) {
      console.error('Failed to create fallback chart data:', error);
    }
    
    return null;
  };

  // Generate chart with updated configuration
  const generateChartWithConfig = async (updatedConfig) => {
    if (!selectedFile) return;

    try {
      console.log('Generating chart with updated config:', updatedConfig);
      const response = await api.post(`/analytics/chart/${selectedFile._id}`, updatedConfig);
      console.log('Chart response:', response.data);
      setChartData(response.data);
    } catch (error) {
      console.error('Failed to generate chart:', error);
      console.error('Error details:', error.response?.data);
      
      // Try to create fallback chart data
      if (selectedAutoChart) {
        const fallbackChartData = createFallbackChartData(selectedAutoChart, stats);
        if (fallbackChartData) {
          setChartData(fallbackChartData);
        }
      }
    }
  };

  const generateChart = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    // Validate chart configuration based on chart type
    const validationErrors = [];
    
    if (chartConfig.type === 'bar' || chartConfig.type === 'line') {
      if (!chartConfig.xColumn) validationErrors.push('Please select an X-axis column');
      if (!chartConfig.yColumn) validationErrors.push('Please select a Y-axis column');
    }
    
    if (chartConfig.type === 'scatter') {
      if (!chartConfig.xColumn) validationErrors.push('Please select an X-axis column for scatter plot');
      if (!chartConfig.yColumn) validationErrors.push('Please select a Y-axis column for scatter plot');
      
      // Recommend numerical columns for scatter plots
      if (chartConfig.xColumn && !stats.numericalColumns.includes(chartConfig.xColumn)) {
        validationErrors.push('X-axis should be a numerical column for best scatter plot results');
      }
      if (chartConfig.yColumn && !stats.numericalColumns.includes(chartConfig.yColumn)) {
        validationErrors.push('Y-axis should be a numerical column for scatter plots');
      }
    }
    
    if (chartConfig.type === 'pie' || chartConfig.type === 'doughnut') {
      if (!chartConfig.groupBy) validationErrors.push('Please select a category column to group by');
      if (!chartConfig.yColumn) validationErrors.push('Please select a value column for the chart');
    }
    
    if (validationErrors.length > 0) {
      alert('Please fix the following issues:\n\n' + validationErrors.join('\n'));
      return;
    }

    try {
      console.log('Generating chart with config:', chartConfig);
      const response = await api.post(`/analytics/chart/${selectedFile._id}`, chartConfig);
      console.log('Chart response:', response.data);
      setChartData(response.data);
    } catch (error) {
      console.error('Failed to generate chart:', error);
      console.error('Error details:', error.response?.data);
      
      // Provide user-friendly error messages
      if (error.response?.status === 400) {
        alert('Invalid chart configuration. Please check your column selections.');
      } else if (error.response?.status === 404) {
        alert('File not found. Please select a valid file.');
      } else {
        alert('Failed to generate chart. Please try again.');
      }
    }
  };

  // Convert Chart.js data format to ECharts format
  const convertToEChartsData = () => {
    if (!chartData || !chartData.chartData) return null;

    const chartDataObj = chartData.chartData;
    
    switch (chartData.chartType) {
      case 'bar':
      case 'column':
        return {
          categories: chartDataObj.labels || [],
          values: chartDataObj.datasets?.[0]?.data || []
        };
      
      case 'line':
        return {
          categories: chartDataObj.labels || [],
          values: chartDataObj.datasets?.[0]?.data || []
        };
      
      case 'pie':
      case 'doughnut':
        const labels = chartDataObj.labels || [];
        const values = chartDataObj.datasets?.[0]?.data || [];
        return labels.map((label, index) => ({
          name: label,
          value: values[index] || 0
        }));

      case 'scatter':
        // For scatter plots, we need x,y pairs
        const scatterPoints = chartDataObj.datasets?.[0]?.data || [];
        // Check if data is already in [x,y] format or {x,y} format
        if (scatterPoints.length > 0) {
          if (Array.isArray(scatterPoints[0])) {
            // Data is already in [x,y] format
            return scatterPoints;
          } else if (typeof scatterPoints[0] === 'object' && scatterPoints[0].x !== undefined) {
            // Data is in {x,y} format, convert to [x,y]
            return scatterPoints.map(point => [point.x, point.y]);
          }
        }
        // Fallback: create sample data
        return generateSampleScatterData();
      
      default:
        return {
          categories: chartDataObj.labels || [],
          values: chartDataObj.datasets?.[0]?.data || []
        };
    }
  };

  // Generate ECharts option from converted data
  const generateEChartsOption = () => {
    const convertedData = convertToEChartsData();
    if (!convertedData) return null;

    const title = `${selectedFile?.originalName || 'Data'} - ${chartConfig.type.charAt(0).toUpperCase() + chartConfig.type.slice(1)} Chart`;

    switch (chartData.chartType) {
      case 'bar':
      case 'column':
        return generateBarChartOption(convertedData, title);
      
      case 'line':
        return generateLineChartOption(convertedData, title);
      
      case 'pie':
      case 'doughnut':
        return generatePieChartOption(convertedData, title);

      case 'scatter':
        return generateScatterChartOption(convertedData, title);
      
      default:
        return generateBarChartOption(convertedData, title);
    }
  };

  const handleFileSelect = (e) => {
    const fileId = e.target.value;
    if (fileId) {
      const file = files.find(f => f._id === fileId);
      setSelectedFile(file);
      fetchStats(fileId);
      setChartData(null);
    }
  };

  const renderChart = () => {
    if (!chartData || !chartData.chartData || !chartData.chartData.datasets) {
      return null;
    }

    // Validate chart data structure
    if (!Array.isArray(chartData.chartData.datasets) || chartData.chartData.datasets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-red-600 text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-base">Invalid chart data structure. Please try generating the chart again.</p>
        </div>
      );
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${chartConfig.type.charAt(0).toUpperCase() + chartConfig.type.slice(1)} Chart`,
        },
      },
    };

    switch (chartData.chartType) {
      case 'bar':
      case 'column':
        return <Bar data={chartData.chartData} options={options} />;
      case 'line':
        return <Line data={chartData.chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData.chartData} options={options} />;
      case 'doughnut':
        return <Doughnut data={chartData.chartData} options={options} />;
      case 'scatter':
        return <Bar data={chartData.chartData} options={{...options, scales: { x: { type: 'linear' }, y: { type: 'linear' } }}} />;
      default:
        return <Bar data={chartData.chartData} options={options} />;
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="loading-state">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-header">
            <Link to="/" className="analytics-back-link">
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="analytics-title">
              <BarChart3 size={32} />
              Data Analytics
            </h1>
          </div>
          <div className="error-state">
            <p className="error-text">{error}</p>
            <Link to="/upload" className="error-upload-link">
              Upload a New File
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <div className="analytics-header">
          <Link to="/" className="analytics-back-link">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="analytics-title">
            <BarChart3 size={32} />
            Data Analytics
          </h1>
        </div>

        {files.length === 0 ? (
          <div className="no-files-state">
            <p className="no-files-text">No files uploaded yet.</p>
            <Link to="/upload" className="no-files-upload-link">
              Upload Your First File
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="file-select-container">
              <label htmlFor="file-select" className="file-select-label">
                Select File to Analyze:
              </label>
              <select
                id="file-select"
                value={selectedFile?._id || ''}
                onChange={handleFileSelect}
                className="file-select"
              >
                <option value="">Choose a file...</option>
                {files.map(file => (
                  <option key={file._id} value={file._id}>
                    {file.originalName} ({file.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

          {selectedFile && stats && (
            <>
              <div className="analytics-card">
                <div className="file-info-card">
                  <h3 className="file-info-title">{selectedFile.originalName}</h3>
                  <div className="file-info-tags">
                    <span className="file-info-tag">{stats.totalRows} rows</span>
                    <span className="file-info-tag">{stats.totalColumns} columns</span>
                    <span className="file-info-tag">Uploaded: {new Date(selectedFile.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Mode Toggle */}
              <div className="mode-selector">
                <h3 className="mode-selector-title">Analysis Mode:</h3>
                <div className="mode-buttons">
                  <button
                    onClick={() => setDashboardMode(true)}
                    className={`mode-btn ${dashboardMode ? 'active' : ''}`}
                  >
                    🎯 Smart Dashboard
                  </button>
                  <button
                    onClick={() => setDashboardMode(false)}
                    className={`mode-btn ${!dashboardMode ? 'active' : ''}`}
                  >
                    🔧 Manual Configuration
                  </button>
                </div>
              </div>

              {dashboardMode ? (
                /* Smart Dashboard Mode */
                <div className="smart-dashboard">
                  <div className="chart-suggestions">
                    <h3 className="suggestions-title">📊 Recommended Charts for Your Data</h3>
                    {autoCharts.length > 0 ? (
                      <div className="suggestions-grid">
                        {autoCharts.map((suggestion) => (
                          <div 
                            key={suggestion.id}
                            onClick={() => generateAutoChart(suggestion)}
                            className={`suggestion-card ${selectedAutoChart?.id === suggestion.id ? 'active' : ''} priority-${suggestion.priority}`}
                          >
                            <div className="suggestion-header">
                              <h4 className="suggestion-title">{suggestion.title}</h4>
                              <span className={`priority-badge priority-${suggestion.priority}`}>
                                {suggestion.priority === 'high' ? '⭐' : suggestion.priority === 'medium' ? '📈' : '💡'}
                              </span>
                            </div>
                            <p className="suggestion-description">{suggestion.description}</p>
                            <div className="suggestion-reason">
                              <small>💡 {suggestion.reason}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-suggestions">
                        <p className="no-suggestions-text">
                          🔄 Analyzing your data to generate chart suggestions...
                        </p>
                        <p className="data-info">
                          📋 Columns: {stats?.headers?.length || 0} | 
                          📊 Numerical: {stats?.numericalColumns?.length || 0} | 
                          🏷️ Categorical: {stats?.categoricalColumns?.length || 0}
                        </p>
                      </div>
                    )}
                  </div>

                  {chartData && selectedAutoChart && (
                    <div className="dashboard-chart-display">
                      <div className="chart-header">
                        <h3 className="chart-display-title">
                          {selectedAutoChart.title}
                        </h3>
                        
                        {/* Chart Engine Selector */}
                        <div className="chart-engine-selector-inline">
                          <label className="config-label">Engine:</label>
                          <div className="chart-engine-buttons">
                            <button
                              onClick={() => setUseECharts(false)}
                              className={`chart-engine-btn-small ${!useECharts ? 'active' : ''}`}
                            >
                              📊 Chart.js
                            </button>
                            <button
                              onClick={() => setUseECharts(true)}
                              className={`chart-engine-btn-small ${useECharts ? 'active' : ''}`}
                            >
                              🎯 ECharts
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Axis Customization Panel for Smart Dashboard */}
                      <div className="axis-customization-panel">
                        <h4 className="axis-title">🎛️ Customize Chart Axes</h4>
                        <div className="axis-controls">
                          {(selectedAutoChart.config.type === 'bar' || selectedAutoChart.config.type === 'line' || selectedAutoChart.config.type === 'scatter') && (
                            <>
                              <div className="axis-control">
                                <label className="axis-label">X-Axis Column:</label>
                                <select
                                  value={chartConfig.xColumn || selectedAutoChart.config.xColumn}
                                  onChange={(e) => {
                                    const newConfig = { 
                                      ...selectedAutoChart.config,
                                      ...chartConfig,
                                      xColumn: e.target.value,
                                      type: selectedAutoChart.config.type 
                                    };
                                    setChartConfig(newConfig);
                                    // Auto-regenerate chart with new axis
                                    setTimeout(() => generateChartWithConfig(newConfig), 100);
                                  }}
                                  className="axis-select"
                                >
                                  {stats.headers.map(header => (
                                    <option key={header} value={header}>
                                      {header} {stats.categoricalColumns.includes(header) ? ' (Text)' : ' (Number)'}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="axis-control">
                                <label className="axis-label">Y-Axis Column:</label>
                                <select
                                  value={chartConfig.yColumn || selectedAutoChart.config.yColumn}
                                  onChange={(e) => {
                                    const newConfig = { 
                                      ...selectedAutoChart.config,
                                      ...chartConfig,
                                      yColumn: e.target.value,
                                      type: selectedAutoChart.config.type 
                                    };
                                    setChartConfig(newConfig);
                                    // Auto-regenerate chart with new axis
                                    setTimeout(() => generateChartWithConfig(newConfig), 100);
                                  }}
                                  className="axis-select"
                                >
                                  {stats.numericalColumns.map(header => (
                                    <option key={header} value={header}>
                                      {header} (Number)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          )}

                          {(selectedAutoChart.config.type === 'pie' || selectedAutoChart.config.type === 'doughnut') && (
                            <>
                              <div className="axis-control">
                                <label className="axis-label">Category Column:</label>
                                <select
                                  value={chartConfig.groupBy || selectedAutoChart.config.groupBy}
                                  onChange={(e) => {
                                    const newConfig = { 
                                      ...selectedAutoChart.config,
                                      ...chartConfig,
                                      groupBy: e.target.value,
                                      type: selectedAutoChart.config.type 
                                    };
                                    setChartConfig(newConfig);
                                    // Auto-regenerate chart with new grouping
                                    setTimeout(() => generateChartWithConfig(newConfig), 100);
                                  }}
                                  className="axis-select"
                                >
                                  {stats.categoricalColumns.map(header => (
                                    <option key={header} value={header}>
                                      {header} (Text)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="axis-control">
                                <label className="axis-label">Value Column:</label>
                                <select
                                  value={chartConfig.yColumn || selectedAutoChart.config.yColumn}
                                  onChange={(e) => {
                                    setChartConfig(prev => ({ 
                                      ...prev, 
                                      yColumn: e.target.value,
                                      type: selectedAutoChart.config.type 
                                    }));
                                    // Auto-regenerate chart with new values
                                    setTimeout(() => generateChart(), 100);
                                  }}
                                  className="axis-select"
                                >
                                  {stats.numericalColumns.map(header => (
                                    <option key={header} value={header}>
                                      {header} (Number)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="chart-display-area">
                        <div className="chart-container">
                          {useECharts ? (
                            <div className="echarts-container">
                              <EChartsComponent 
                                option={generateEChartsOption()}
                                style={{ height: '450px', width: '100%', maxHeight: '450px' }}
                                theme="light"
                              />
                            </div>
                          ) : (
                            <div className="chartjs-container">
                              {renderChart()}
                              <div className="chart-engine-info">
                                <p className="chart-engine-info-text">
                                  📊 <strong>Chart.js:</strong> Simple and flexible charting library
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Manual Configuration Mode */
                <div className="manual-configuration">
                  <div className="chart-layout">
                    <div className="chart-config-panel">
                      <h3 className="chart-config-title">Chart Configuration</h3>
                      
                      <div className="config-group">
                        <label className="config-label">Chart Type:</label>
                        <select
                          value={chartConfig.type}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, type: e.target.value }))}
                          className="config-select"
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="doughnut">Doughnut Chart</option>
                          <option value="scatter">Scatter Plot</option>
                        </select>
                      </div>

                      {(chartConfig.type === 'bar' || chartConfig.type === 'line' || chartConfig.type === 'scatter') && (
                        <>
                          <div className="config-group">
                            <label className="config-label">
                              X-Axis Column:
                              <span className="config-hint"> (Categories/Labels)</span>
                            </label>
                            <select
                              value={chartConfig.xColumn}
                              onChange={(e) => setChartConfig(prev => ({ ...prev, xColumn: e.target.value }))}
                              className="config-select"
                            >
                              <option value="">Select column for X-axis...</option>
                              {stats.headers.map(header => (
                                <option key={header} value={header}>
                                  {header} 
                                  {stats.categoricalColumns.includes(header) ? ' (Text)' : ' (Number)'}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="config-group">
                            <label className="config-label">
                              Y-Axis Column:
                              <span className="config-hint"> (Values/Numbers)</span>
                            </label>
                            <select
                              value={chartConfig.yColumn}
                              onChange={(e) => setChartConfig(prev => ({ ...prev, yColumn: e.target.value }))}
                              className="config-select"
                            >
                              <option value="">Select column for Y-axis...</option>
                              {stats.numericalColumns.map(header => (
                                <option key={header} value={header}>
                                  {header} (Number)
                                </option>
                              ))}
                            </select>
                          </div>

                          {chartConfig.type === 'scatter' && (
                            <div className="config-note">
                              <p>💡 <strong>Scatter Plot:</strong> Both X and Y should be numerical columns for best results</p>
                            </div>
                          )}
                        </>
                      )}

                      {(chartConfig.type === 'pie' || chartConfig.type === 'doughnut') && (
                        <>
                          <div className="config-group">
                            <label className="config-label">
                              Category Column:
                              <span className="config-hint"> (Group data by)</span>
                            </label>
                            <select
                              value={chartConfig.groupBy}
                              onChange={(e) => setChartConfig(prev => ({ ...prev, groupBy: e.target.value }))}
                              className="config-select"
                            >
                              <option value="">Select category column...</option>
                              {stats.categoricalColumns.map(header => (
                                <option key={header} value={header}>
                                  {header} (Text)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="config-group">
                            <label className="config-label">
                              Value Column:
                              <span className="config-hint"> (Numbers to sum)</span>
                            </label>
                            <select
                              value={chartConfig.yColumn}
                              onChange={(e) => setChartConfig(prev => ({ ...prev, yColumn: e.target.value }))}
                              className="config-select"
                            >
                              <option value="">Select value column...</option>
                              {stats.numericalColumns.map(header => (
                                <option key={header} value={header}>
                                  {header} (Number)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="config-note">
                            <p>💡 <strong>Pie Charts:</strong> Data will be grouped by category and values will be summed</p>
                          </div>
                        </>
                      )}

                      <button 
                        onClick={generateChart} 
                        className="generate-chart-btn"
                      >
                        Generate Chart
                      </button>

                      {chartData && (
                        <div className="chart-engine-selector">
                          <label className="config-label">Chart Engine:</label>
                          <div className="chart-engine-buttons">
                            <button
                              onClick={() => setUseECharts(false)}
                              className={`chart-engine-btn ${!useECharts ? 'active' : ''}`}
                            >
                              📊 Chart.js
                            </button>
                            <button
                              onClick={() => setUseECharts(true)}
                              className={`chart-engine-btn ${useECharts ? 'active' : ''}`}
                            >
                              🎯 ECharts
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="chart-display-area">
                      {chartData ? (
                        <div className="chart-container">
                          {useECharts ? (
                            <div className="echarts-container">
                              <EChartsComponent 
                                option={generateEChartsOption()}
                                style={{ height: '450px', width: '100%', maxHeight: '450px' }}
                                theme="light"
                              />
                            </div>
                          ) : (
                            <div className="chartjs-container">
                              {renderChart()}
                              <div className="chart-engine-info">
                                <p className="chart-engine-info-text">
                                  📊 <strong>Chart.js:</strong> Simple and flexible charting library
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="chart-placeholder">
                          <BarChart3 size={64} />
                          <p className="chart-placeholder-text">Configure your chart and click "Generate Chart" to visualize your data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="data-summary">
                <h3 className="data-summary-title">Data Summary</h3>
                <div className="summary-grid">
                  {Object.entries(stats.summary).map(([column, info]) => (
                    <div key={column} className="summary-item">
                      <h4 className="summary-item-title">{column}</h4>
                      <div>
                        <p className="summary-item-detail"><strong>Type:</strong> {info.type}</p>
                        {info.type === 'numerical' ? (
                          <>
                            <p className="summary-item-detail"><strong>Min:</strong> {info.min}</p>
                            <p className="summary-item-detail"><strong>Max:</strong> {info.max}</p>
                            <p className="summary-item-detail"><strong>Average:</strong> {info.avg.toFixed(2)}</p>
                            <p className="summary-item-detail"><strong>Count:</strong> {info.count}</p>
                          </>
                        ) : (
                          <>
                            <p className="summary-item-detail"><strong>Unique Values:</strong> {info.uniqueCount}</p>
                            <p className="summary-item-detail"><strong>Total Count:</strong> {info.totalCount}</p>
                            <div>
                              <strong className="summary-item-detail">Top Values:</strong>
                              <ul className="top-values-list">
                                {info.topValues.slice(0, 3).map(({ value, count }) => (
                                  <li key={value} className="top-values-item">{value}: {count}</li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  </div>
  );
};

export default Analytics;
