const express = require('express');
const ExcelData = require('../models/ExcelData');
const cloudinary = require('../config/cloudinary');
const XLSX = require('xlsx');
const axios = require('axios');

const router = express.Router();

// Helper function to fetch and parse data from Cloudinary
async function fetchDataFromCloudinary(file) {
    try {
        const response = await axios.get(file.cloudinary.url, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(response.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // Analyze column types
        const headers = file.headers || Object.keys(data[0] || {});
        const columnTypes = {};
        
        headers.forEach(header => {
            const columnData = data
                .map(row => row[header])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (columnData.length === 0) {
                columnTypes[header] = 'unknown';
                return;
            }
            
            const isNumerical = columnData.every(val => {
                const parsed = parseFloat(val);
                return !isNaN(parsed) && isFinite(parsed);
            });
            
            const isDate = columnData.some(val => {
                const date = new Date(val);
                return !isNaN(date.getTime()) && val.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/);
            });
            
            if (isNumerical) {
                columnTypes[header] = 'numerical';
            } else if (isDate) {
                columnTypes[header] = 'date';
            } else {
                columnTypes[header] = 'categorical';
            }
        });
        
        return { data, columnTypes };
    } catch (error) {
        console.error('Error fetching data from Cloudinary:', error);
        throw new Error('Failed to fetch file data from Cloudinary');
    }
}

// Get basic statistics for a file
router.get('/stats/:fileId', async (req, res) => {
    try {
        const file = await ExcelData.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Fetch data from Cloudinary
        const { data, columnTypes } = await fetchDataFromCloudinary(file);

        const stats = {
            totalRows: data.length,
            totalColumns: file.headers.length,
            headers: file.headers,
            numericalColumns: [],
            categoricalColumns: [],
            summary: {}
        };

        // Analyze each column
        file.headers.forEach(header => {
            const columnData = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
            
            if (columnData.length === 0) return;

            // Check if column is numerical
            const isNumerical = columnData.every(val => !isNaN(parseFloat(val)) && isFinite(val));
            
            if (isNumerical) {
                stats.numericalColumns.push(header);
                const numbers = columnData.map(val => parseFloat(val));
                stats.summary[header] = {
                    type: 'numerical',
                    min: Math.min(...numbers),
                    max: Math.max(...numbers),
                    avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
                    count: numbers.length
                };
            } else {
                stats.categoricalColumns.push(header);
                const uniqueValues = [...new Set(columnData)];
                const valueCounts = {};
                columnData.forEach(val => {
                    valueCounts[val] = (valueCounts[val] || 0) + 1;
                });
                
                stats.summary[header] = {
                    type: 'categorical',
                    uniqueCount: uniqueValues.length,
                    topValues: Object.entries(valueCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([value, count]) => ({ value, count })),
                    totalCount: columnData.length
                };
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('Stats generation error:', error);
        res.status(500).json({ error: 'Failed to generate statistics', details: error.message });
    }
});

// Generate chart data for specific columns
router.post('/chart/:fileId', async (req, res) => {
    try {
        const { chartType, xColumn, yColumn, groupBy } = req.body;
        
        // Validate required parameters
        if (!chartType) {
            return res.status(400).json({ error: 'Chart type is required' });
        }
        
        const file = await ExcelData.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Fetch data from Cloudinary
        const { data, columnTypes } = await fetchDataFromCloudinary(file);
        const headers = file.headers;
        
        // Validate columns exist
        if (xColumn && !headers.includes(xColumn)) {
            return res.status(400).json({ error: `Column '${xColumn}' not found in file` });
        }
        if (yColumn && !headers.includes(yColumn)) {
            return res.status(400).json({ error: `Column '${yColumn}' not found in file` });
        }
        if (groupBy && !headers.includes(groupBy)) {
            return res.status(400).json({ error: `Column '${groupBy}' not found in file` });
        }
        
        let chartData = {};

        switch (chartType.toLowerCase()) {
            case 'bar':
            case 'column':
                // For bar charts, we need either groupBy OR both xColumn and yColumn
                if (!groupBy && (!xColumn || !yColumn)) {
                    return res.status(400).json({ 
                        error: 'Bar charts require either a groupBy column OR both xColumn and yColumn' 
                    });
                }
                chartData = generateBarChartData(data, xColumn, yColumn, groupBy);
                break;

            case 'pie':
            case 'doughnut':
                if (!groupBy) {
                    return res.status(400).json({ error: 'groupBy column is required for pie charts' });
                }
                chartData = generatePieChartData(data, groupBy);
                break;

            case 'line':
                if (!xColumn || !yColumn) {
                    return res.status(400).json({ error: 'Both xColumn and yColumn are required for line charts' });
                }
                chartData = generateLineChartData(data, xColumn, yColumn, file.columnTypes);
                break;
                
            case 'scatter':
                if (!xColumn || !yColumn) {
                    return res.status(400).json({ error: 'Both xColumn and yColumn are required for scatter plots' });
                }
                chartData = generateScatterChartData(data, xColumn, yColumn);
                break;

            default:
                return res.status(400).json({ error: `Unsupported chart type: ${chartType}` });
        }

        if (!chartData || (!chartData.labels && !chartData.datasets) || (chartData.labels && chartData.labels.length === 0)) {
            return res.status(400).json({ 
                error: 'Invalid chart configuration. Please check your column selections.',
                details: chartData.error || 'No valid data found for the specified configuration'
            });
        }

        res.json({ 
            success: true,
            chartType, 
            chartData,
            config: { xColumn, yColumn, groupBy }
        });
    } catch (error) {
        console.error('Chart generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate chart data',
            details: error.message 
        });
    }
});

// Generate bar chart data
function generateBarChartData(data, xColumn, yColumn, groupBy) {
    if (groupBy) {
        // Group data by category and count or sum
        const grouped = {};
        data.forEach(row => {
            const category = row[groupBy];
            if (category !== null && category !== undefined && category !== '') {
                if (!grouped[category]) grouped[category] = 0;
                
                if (yColumn) {
                    const value = parseFloat(row[yColumn]);
                    if (!isNaN(value)) {
                        grouped[category] += value;
                    }
                } else {
                    grouped[category]++;
                }
            }
        });
        
        return {
            labels: Object.keys(grouped),
            datasets: [{
                label: yColumn ? `Sum of ${yColumn} by ${groupBy}` : `Count by ${groupBy}`,
                data: Object.values(grouped),
                backgroundColor: generateColors(Object.keys(grouped).length),
                borderColor: generateColors(Object.keys(grouped).length, 0.8),
                borderWidth: 1
            }],
            // ECharts specific configuration to fix overlap issues
            echartsConfig: {
                title: {
                    left: 'center',
                    top: '10px',
                    textStyle: { 
                        fontSize: 16, 
                        fontWeight: 'bold',
                        color: '#333'
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    top: '45px',
                    left: 'center',
                    itemGap: 15
                },
                grid: {
                    top: '80px',
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    axisLabel: {
                        interval: 0,
                        rotate: Object.keys(grouped).length > 5 ? 45 : 0
                    }
                },
                yAxis: {
                    type: 'value'
                }
            }
        };
    } else if (xColumn && yColumn) {
        // X vs Y analysis - aggregate by X values
        const aggregated = {};
        data.forEach(row => {
            const x = row[xColumn];
            const y = parseFloat(row[yColumn]);
            if (x && !isNaN(y)) {
                if (!aggregated[x]) aggregated[x] = [];
                aggregated[x].push(y);
            }
        });
        
        // Calculate averages for each x value
        const labels = Object.keys(aggregated);
        const values = labels.map(label => {
            const vals = aggregated[label];
            return vals.reduce((sum, val) => sum + val, 0) / vals.length;
        });
        
        return {
            labels,
            datasets: [{
                label: `Average ${yColumn} by ${xColumn}`,
                data: values,
                backgroundColor: generateColors(labels.length),
                borderColor: generateColors(labels.length, 0.8),
                borderWidth: 1
            }],
            // ECharts specific configuration to fix overlap issues
            echartsConfig: {
                title: {
                    left: 'center',
                    top: '10px',
                    textStyle: { 
                        fontSize: 16, 
                        fontWeight: 'bold',
                        color: '#333'
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    top: '45px',
                    left: 'center',
                    itemGap: 15
                },
                grid: {
                    top: '80px',
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    axisLabel: {
                        interval: 0,
                        rotate: labels.length > 5 ? 45 : 0
                    }
                },
                yAxis: {
                    type: 'value'
                }
            }
        };
    } else {
        // If no valid configuration provided, return empty structure
        return {
            labels: [],
            datasets: [],
            error: 'Invalid configuration for bar chart'
        };
    }
}

// Auto-suggest chart configurations based on file statistics
router.get('/suggest/:fileId', async (req, res) => {
    try {
        const file = await ExcelData.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Fetch data from Cloudinary
        const { data, columnTypes } = await fetchDataFromCloudinary(file);
        const headers = file.headers;
        
        // If columnTypes not available, they're already computed in fetchDataFromCloudinary
        headers.forEach(header => {
            const uniqueValues = [...new Set(data.map(row => row[col]))].filter(val => val !== null && val !== undefined && val !== '').length;
            if (uniqueValues > 1 && uniqueValues <= 20) { // Reasonable number of categories
                suggestions.push({
                    chartType: 'bar',
                    groupBy: col,
                    title: `Distribution of ${col}`,
                    description: `Bar chart showing count by ${col}`,
                    suitability: 'high',
                    reason: 'Good for showing distribution of categorical data'
                });
            }
        });

        // 2. Pie charts for categorical columns with fewer categories
        categoricalColumns.forEach(col => {
            const uniqueValues = [...new Set(data.map(row => row[col]))].filter(val => val !== null && val !== undefined && val !== '').length;
            if (uniqueValues > 1 && uniqueValues <= 8) { // Pie charts work best with fewer categories
                suggestions.push({
                    chartType: 'pie',
                    groupBy: col,
                    title: `${col} Distribution`,
                    description: `Pie chart showing distribution by ${col}`,
                    suitability: 'medium',
                    reason: 'Good for showing proportions of categorical data'
                });
            }
        });

        // 3. Line charts for trends (date/categorical + numerical)
        if (dateColumns.length > 0 && numericalColumns.length > 0) {
            dateColumns.forEach(dateCol => {
                numericalColumns.forEach(numCol => {
                    suggestions.push({
                        chartType: 'line',
                        xColumn: dateCol,
                        yColumn: numCol,
                        title: `${numCol} over Time`,
                        description: `Line chart showing ${numCol} trend over ${dateCol}`,
                        suitability: 'high',
                        reason: 'Excellent for showing trends over time'
                    });
                });
            });
        }

        // 4. Line charts for categorical x-axis with numerical y-axis
        if (categoricalColumns.length > 0 && numericalColumns.length > 0) {
            categoricalColumns.forEach(catCol => {
                numericalColumns.forEach(numCol => {
                    const uniqueValues = [...new Set(data.map(row => row[catCol]))].filter(val => val !== null && val !== undefined && val !== '').length;
                    if (uniqueValues <= 15) {
                        suggestions.push({
                            chartType: 'bar',
                            xColumn: catCol,
                            yColumn: numCol,
                            title: `${numCol} by ${catCol}`,
                            description: `Bar chart showing average ${numCol} by ${catCol}`,
                            suitability: 'high',
                            reason: 'Good for comparing numerical values across categories'
                        });
                    }
                });
            });
        }

        // 5. Scatter plots for numerical vs numerical
        if (numericalColumns.length >= 2) {
            for (let i = 0; i < numericalColumns.length; i++) {
                for (let j = i + 1; j < numericalColumns.length; j++) {
                    suggestions.push({
                        chartType: 'scatter',
                        xColumn: numericalColumns[i],
                        yColumn: numericalColumns[j],
                        title: `${numericalColumns[j]} vs ${numericalColumns[i]}`,
                        description: `Scatter plot showing relationship between ${numericalColumns[i]} and ${numericalColumns[j]}`,
                        suitability: 'medium',
                        reason: 'Good for identifying correlations between numerical variables'
                    });
                }
            }
        }

        // Sort suggestions by suitability
        const suitabilityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        suggestions.sort((a, b) => suitabilityOrder[b.suitability] - suitabilityOrder[a.suitability]);

        res.json({ 
            suggestions: suggestions.slice(0, 10), // Return top 10 suggestions
            columnTypes,
            summary: {
                totalColumns: headers.length,
                numericalColumns: numericalColumns.length,
                categoricalColumns: categoricalColumns.length,
                dateColumns: dateColumns.length
            }
        });
    } catch (error) {
        console.error('Chart suggestion error:', error);
        res.status(500).json({ 
            error: 'Failed to generate chart suggestions',
            details: error.message 
        });
    }
});

// Generate pie chart data
function generatePieChartData(data, groupBy) {
    const grouped = {};
    data.forEach(row => {
        const category = row[groupBy];
        if (category !== null && category !== undefined && category !== '') {
            grouped[category] = (grouped[category] || 0) + 1;
        }
    });
    
    return {
        labels: Object.keys(grouped),
        datasets: [{
            data: Object.values(grouped),
            backgroundColor: generateColors(Object.keys(grouped).length),
            borderColor: generateColors(Object.keys(grouped).length, 0.8),
            borderWidth: 2
        }],
        // ECharts specific configuration to fix overlap issues
        echartsConfig: {
            title: {
                left: 'center',
                top: '10px',
                textStyle: { 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: '#333'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'horizontal',
                left: 'center',
                top: '45px',
                itemGap: 15,
                itemWidth: 14,
                itemHeight: 14,
                textStyle: {
                    fontSize: 12,
                    color: '#666'
                }
            },
            series: [{
                name: groupBy,
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '65%'], // Move center down to avoid overlap
                avoidLabelOverlap: true,
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '16',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                }
            }],
            grid: {
                top: '90px',
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            }
        }
    };
}

// Generate line chart data
function generateLineChartData(data, xColumn, yColumn, columnTypes) {
    const processedData = data
        .map(row => ({
            x: row[xColumn],
            y: parseFloat(row[yColumn]) || 0
        }))
        .filter(item => item.x !== null && item.x !== undefined && item.x !== '' && !isNaN(item.y));
    
    // Sort data based on column type
    if (columnTypes && columnTypes[xColumn] === 'date') {
        processedData.sort((a, b) => new Date(a.x) - new Date(b.x));
    } else if (columnTypes && columnTypes[xColumn] === 'numerical') {
        processedData.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
    } else {
        processedData.sort((a, b) => a.x.toString().localeCompare(b.x.toString()));
    }
    
    return {
        labels: processedData.map(item => item.x),
        datasets: [{
            label: `${yColumn} over ${xColumn}`,
            data: processedData.map(item => item.y),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
        }],
        // ECharts specific configuration to fix overlap issues
        echartsConfig: {
            title: {
                left: 'center',
                top: '10px',
                textStyle: { 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: '#333'
                }
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                top: '45px',
                left: 'center',
                itemGap: 15
            },
            grid: {
                top: '80px',
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                axisLabel: {
                    interval: 0,
                    rotate: processedData.length > 10 ? 45 : 0
                }
            },
            yAxis: {
                type: 'value'
            }
        }
    };
}

// Generate scatter chart data
function generateScatterChartData(data, xColumn, yColumn) {
    const processedData = data
        .map(row => ({
            x: parseFloat(row[xColumn]),
            y: parseFloat(row[yColumn])
        }))
        .filter(item => !isNaN(item.x) && !isNaN(item.y));
    
    return {
        datasets: [{
            label: `${yColumn} vs ${xColumn}`,
            data: processedData,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: '#3B82F6',
            borderWidth: 1
        }]
    };
}

// Helper function to generate colors
function generateColors(count, alpha = 1) {
    const baseColors = [
        '255, 99, 132',   // Red
        '54, 162, 235',   // Blue
        '255, 205, 86',   // Yellow
        '75, 192, 192',   // Teal
        '153, 102, 255',  // Purple
        '255, 159, 64',   // Orange
        '201, 203, 207',  // Grey
        '255, 99, 255',   // Pink
        '99, 255, 132',   // Green
        '132, 99, 255'    // Violet
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        const colorIndex = i % baseColors.length;
        const rgb = baseColors[colorIndex];
        
        if (alpha === 1) {
            result.push(`rgb(${rgb})`);
        } else {
            result.push(`rgba(${rgb}, ${alpha})`);
        }
    }
    return result;
}

module.exports = router;
