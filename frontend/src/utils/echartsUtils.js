// Utility functions for generating ECharts configurations

export const generateBarChartOption = (data, title = 'Bar Chart') => {
  return {
    title: {
      text: title,
      left: 'center',
      top: '5%',
      textStyle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: {
        color: '#1E293B'
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLine: {
        lineStyle: {
          color: '#CBD5E1'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#CBD5E1'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9'
        }
      }
    },
    series: [
      {
        data: data.values,
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#06B6D4' }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#2563EB' },
                { offset: 1, color: '#0891B2' }
              ]
            }
          }
        }
      }
    ]
  };
};

export const generateLineChartOption = (data, title = 'Line Chart') => {
  return {
    title: {
      text: title,
      left: 'center',
      top: '5%',
      textStyle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: {
        color: '#1E293B'
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLine: {
        lineStyle: {
          color: '#CBD5E1'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#CBD5E1'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9'
        }
      }
    },
    series: [
      {
        data: data.values,
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#3B82F6',
          width: 3
        },
        itemStyle: {
          color: '#3B82F6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      }
    ]
  };
};

export const generatePieChartOption = (data, title = 'Pie Chart') => {
  return {
    title: {
      text: title,
      left: 'center',
      top: '5%',
      textStyle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: {
        color: '#1E293B'
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: '1%',
      left: 'center',
      textStyle: {
        color: '#64748B',
        fontSize: 20
      },
      itemGap: 20,
      itemWidth: 15,
      itemHeight: 11
    },
    grid: {
      top: '18%',
      bottom: '20%',
      left: '5%',
      right: '5%'
    },
    series: [
      {
        name: 'Data',
        type: 'pie',
        radius: ['22%', '58%'],
        center: ['50%', '47%'],
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: getGradientColor(index)
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          fontSize: 10,
          color: '#64748B',
          formatter: '{b}: {c}',
          position: 'outside'
        }
      }
    ]
  };
};

export const generateScatterChartOption = (data, title = 'Scatter Chart') => {
  return {
    title: {
      text: title,
      left: 'center',
      top: '5%',
      textStyle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: {
        color: '#1E293B'
      },
      formatter: function (params) {
        return `${params.seriesName}<br/>X: ${params.value[0]}<br/>Y: ${params.value[1]}`;
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#CBD5E1'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#CBD5E1'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9'
        }
      }
    },
    series: [
      {
        name: 'Data Points',
        symbolSize: 8,
        data: data,
        type: 'scatter',
        itemStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#06B6D4' }
            ]
          }
        }
      }
    ]
  };
};

// Helper function to get gradient colors for pie chart
const getGradientColor = (index) => {
  const colors = [
    { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#3B82F6' }, { offset: 1, color: '#06B6D4' }] },
    { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#8B5CF6' }, { offset: 1, color: '#A855F7' }] },
    { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#059669' }] },
    { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#D97706' }] },
    { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#EF4444' }, { offset: 1, color: '#DC2626' }] },
  ];
  return colors[index % colors.length];
};

// Sample data generators for testing
export const generateSampleBarData = () => ({
  categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [820, 932, 901, 934, 1290, 1330, 1320]
});

export const generateSampleLineData = () => ({
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [150, 230, 224, 218, 135, 147]
});

export const generateSamplePieData = () => [
  { value: 1048, name: 'Search Engine' },
  { value: 735, name: 'Direct' },
  { value: 580, name: 'Email' },
  { value: 484, name: 'Union Ads' },
  { value: 300, name: 'Video Ads' }
];

export const generateSampleScatterData = () => [
  [10.0, 8.04],
  [8.07, 6.95],
  [13.0, 7.58],
  [9.05, 8.81],
  [11.0, 8.33],
  [14.0, 7.66],
  [13.4, 6.81],
  [10.0, 6.33],
  [14.0, 8.96],
  [12.5, 6.82],
  [9.15, 7.20],
  [11.5, 7.20],
  [3.03, 4.23],
  [12.2, 7.83],
  [2.02, 4.47],
  [1.05, 3.33],
  [4.05, 4.96],
  [6.03, 7.24],
  [12.0, 6.26],
  [12.0, 8.84],
  [7.08, 5.82],
  [5.02, 5.68]
];
