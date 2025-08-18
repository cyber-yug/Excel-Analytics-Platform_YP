const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://192.168.1.21:3001/api';

async function testEnhancedAPI() {
    console.log('🧪 Testing Enhanced Excel Analytics API\n');

    try {
        // Test 1: Get uploaded files
        console.log('1. Testing file listing...');
        const filesResponse = await axios.get(`${BASE_URL}/upload/files`);
        console.log(`✅ Found ${filesResponse.data.files.length} files`);

        if (filesResponse.data.files.length > 0) {
            const fileId = filesResponse.data.files[0]._id;
            console.log(`📁 Using file ID: ${fileId}\n`);

            // Test 2: Get file statistics
            console.log('2. Testing file statistics...');
            const statsResponse = await axios.get(`${BASE_URL}/analytics/stats/${fileId}`);
            console.log('✅ File statistics retrieved');
            console.log(`   - Total rows: ${statsResponse.data.totalRows}`);
            console.log(`   - Total columns: ${statsResponse.data.totalColumns}`);
            console.log(`   - Numerical columns: ${statsResponse.data.numericalColumns.length}`);
            console.log(`   - Categorical columns: ${statsResponse.data.categoricalColumns.length}\n`);

            // Test 3: Get chart suggestions
            console.log('3. Testing chart suggestions...');
            try {
                const suggestResponse = await axios.get(`${BASE_URL}/analytics/suggest/${fileId}`);
                console.log('✅ Chart suggestions retrieved');
                console.log(`   - Number of suggestions: ${suggestResponse.data.suggestions.length}`);
                if (suggestResponse.data.suggestions.length > 0) {
                    console.log(`   - Top suggestion: ${suggestResponse.data.suggestions[0].title}`);
                    console.log(`   - Chart type: ${suggestResponse.data.suggestions[0].chartType}`);
                }
                console.log();

                // Test 4: Generate chart data using first suggestion
                if (suggestResponse.data.suggestions.length > 0) {
                    console.log('4. Testing chart data generation...');
                    const suggestion = suggestResponse.data.suggestions[0];
                    
                    const chartConfig = {
                        chartType: suggestion.chartType,
                        xColumn: suggestion.xColumn,
                        yColumn: suggestion.yColumn,
                        groupBy: suggestion.groupBy
                    };

                    const chartResponse = await axios.post(`${BASE_URL}/analytics/chart/${fileId}`, chartConfig);
                    console.log('✅ Chart data generated successfully');
                    console.log(`   - Chart type: ${chartResponse.data.chartType}`);
                    console.log(`   - Has labels: ${!!chartResponse.data.chartData.labels}`);
                    console.log(`   - Has datasets: ${!!chartResponse.data.chartData.datasets}`);
                    console.log(`   - Dataset count: ${chartResponse.data.chartData.datasets?.length || 0}`);
                    console.log();
                }

                // Test 5: Test error handling with invalid chart config
                console.log('5. Testing error handling...');
                try {
                    await axios.post(`${BASE_URL}/analytics/chart/${fileId}`, {
                        chartType: 'invalid_type',
                        xColumn: 'nonexistent_column'
                    });
                    console.log('❌ Error handling test failed - should have thrown error');
                } catch (error) {
                    if (error.response && error.response.status === 400) {
                        console.log('✅ Error handling works correctly');
                        console.log(`   - Error message: ${error.response.data.error}`);
                    } else {
                        console.log('❌ Unexpected error:', error.message);
                    }
                }
                console.log();

            } catch (error) {
                console.log('❌ Chart suggestions test failed:', error.message);
                console.log('   This might be expected if the endpoint is new\n');
            }

        } else {
            console.log('⚠️  No files found. Upload a file first to test chart functionality.\n');
        }

        console.log('🎉 API testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
    }
}

// Run tests if file is executed directly
if (require.main === module) {
    testEnhancedAPI();
}

module.exports = { testEnhancedAPI };
