# ECharts Integration Guide

This guide explains how to use ECharts in your Excel Analytics Platform.

## What's Included

### 1. EChartsComponent (`/src/components/EChartsComponent.jsx`)
A reusable React component wrapper for ECharts that handles:
- Chart initialization and cleanup
- Automatic resizing on window resize
- Theme support
- Option updates

### 2. ECharts Utilities (`/src/utils/echartsUtils.js`)
Helper functions for generating chart configurations:
- `generateBarChartOption()` - Creates bar chart configurations
- `generateLineChartOption()` - Creates line chart configurations  
- `generatePieChartOption()` - Creates pie chart configurations
- `generateScatterChartOption()` - Creates scatter plot configurations
- Sample data generators for testing

### 3. Demo Page (`/src/pages/EChartsDemo.jsx`)
A complete demo showcasing all chart types with:
- Interactive chart type selection
- Beautiful styling matching your app's theme
- Feature highlights
- Code examples

## Quick Start

### Basic Usage

```jsx
import EChartsComponent from './components/EChartsComponent';
import { generateBarChartOption } from './utils/echartsUtils';

const MyChart = () => {
  const data = {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    values: [120, 200, 150, 80, 70]
  };
  
  const option = generateBarChartOption(data, 'Weekly Sales');

  return (
    <EChartsComponent 
      option={option}
      style={{ height: '400px', width: '100%' }}
    />
  );
};
```

### Available Chart Types

1. **Bar Charts** - Perfect for comparing categories
2. **Line Charts** - Great for showing trends over time
3. **Pie Charts** - Ideal for showing proportions
4. **Scatter Plots** - Excellent for correlation analysis

### Integration with Your Analytics Page

You can integrate ECharts into your existing Analytics page by:

1. Import the ECharts utilities
2. Convert your existing data format
3. Generate ECharts options
4. Use the EChartsComponent

Example integration:
```jsx
import EChartsComponent from '../components/EChartsComponent';
import { generateBarChartOption } from '../utils/echartsUtils';

// In your Analytics component
const convertDataForECharts = (chartData) => {
  return {
    categories: chartData.labels,
    values: chartData.datasets[0].data
  };
};

const echartsOption = generateBarChartOption(
  convertDataForECharts(yourChartData), 
  'Your Chart Title'
);

// Render
<EChartsComponent option={echartsOption} />
```

## Features

### 🎨 Beautiful Styling
- Matches your app's gradient color scheme
- Responsive design
- Smooth animations
- Custom tooltips and legends

### ⚡ High Performance
- Optimized for large datasets
- Smooth animations
- Hardware acceleration
- Efficient rendering

### 📱 Responsive
- Automatic resizing
- Mobile-friendly
- Touch interactions
- Adaptive layouts

### 🔧 Customizable
- Easy theme switching
- Custom color schemes
- Flexible styling options
- Extensive configuration

## Advanced Usage

### Custom Chart Options
You can create custom chart configurations by directly using ECharts options:

```jsx
const customOption = {
  title: { text: 'Custom Chart' },
  xAxis: { type: 'category', data: ['A', 'B', 'C'] },
  yAxis: { type: 'value' },
  series: [{
    data: [120, 200, 150],
    type: 'bar',
    itemStyle: {
      color: {
        type: 'linear',
        colorStops: [
          { offset: 0, color: '#3B82F6' },
          { offset: 1, color: '#06B6D4' }
        ]
      }
    }
  }]
};

<EChartsComponent option={customOption} />
```

### Theme Support
```jsx
<EChartsComponent 
  option={option}
  theme="dark" // or "light"
  style={{ height: '400px' }}
/>
```

## Next Steps

1. Visit `/echarts-demo` to see all chart types in action
2. Integrate ECharts into your Analytics page
3. Customize the styling to match your needs
4. Explore advanced ECharts features from the official documentation

## Packages Installed

- `echarts` - The core ECharts library
- `echarts-for-react` - React wrapper (if needed for advanced use cases)

The current implementation uses the core ECharts library directly for maximum flexibility and performance.
