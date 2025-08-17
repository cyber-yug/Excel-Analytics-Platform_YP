import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const EChartsComponent = ({ option, style = { height: '400px', width: '100%' }, theme = 'light' }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Initialize the chart
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current, theme);
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [theme]);

  useEffect(() => {
    // Update chart when option changes
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={chartRef} style={style} />;
};

export default EChartsComponent; 
