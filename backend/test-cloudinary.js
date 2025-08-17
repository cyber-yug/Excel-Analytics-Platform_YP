const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

// Test Cloudinary connection
async function testCloudinaryConnection() {
    console.log('🌤️  Testing Cloudinary Connection...');
    console.log('================================');
    
    try {
        // Test 1: Check configuration
        console.log('📋 Configuration:');
        console.log('  Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('  API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
        console.log('  API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');
        console.log('');
        
        // Test 2: Check API connectivity
        console.log('🔌 Testing API connectivity...');
        const pingResult = await cloudinary.api.ping();
        console.log('✅ Cloudinary API ping successful:', pingResult);
        console.log('');
        
        // Test 3: Get account details
        console.log('👤 Getting account details...');
        const cloudDetails = await cloudinary.api.resources({
            max_results: 1
        });
        console.log('✅ Account accessible. Resource count sample:', cloudDetails.resources.length);
        console.log('');
        
        // Test 4: Upload a simple text file as test
        console.log('📤 Testing upload capability...');
        
        // Create a simple test file
        const testContent = `Cloudinary Test Upload\nTimestamp: ${new Date().toISOString()}\nTest from Excel Analytics Platform`;
        const testFilePath = path.join(__dirname, 'test-upload.txt');
        fs.writeFileSync(testFilePath, testContent);
        
        const uploadResult = await cloudinary.uploader.upload(testFilePath, {
            folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'excel-uploads',
            resource_type: 'auto',
            public_id: `test-${Date.now()}`
        });
        
        console.log('✅ Upload successful!');
        console.log('  Public ID:', uploadResult.public_id);
        console.log('  URL:', uploadResult.secure_url);
        console.log('  Format:', uploadResult.format);
        console.log('  Size:', uploadResult.bytes, 'bytes');
        console.log('');
        
        // Test 5: Delete the test file from Cloudinary
        console.log('🗑️  Cleaning up test file...');
        const deleteResult = await cloudinary.uploader.destroy(uploadResult.public_id);
        console.log('✅ Test file deleted:', deleteResult.result);
        
        // Clean up local test file
        fs.unlinkSync(testFilePath);
        console.log('✅ Local test file cleaned up');
        console.log('');
        
        console.log('🎉 All Cloudinary tests passed! Connection is working perfectly.');
        
    } catch (error) {
        console.error('❌ Cloudinary test failed:');
        console.error('  Error Type:', error.name);
        console.error('  Message:', error.message);
        
        if (error.http_code) {
            console.error('  HTTP Code:', error.http_code);
        }
        
        if (error.error) {
            console.error('  API Error:', error.error);
        }
        
        console.log('');
        console.log('🔧 Troubleshooting tips:');
        console.log('  1. Verify your Cloudinary credentials in .env file');
        console.log('  2. Check if your API key and secret are correct');
        console.log('  3. Ensure your Cloudinary account is active');
        console.log('  4. Check network connectivity');
        
        process.exit(1);
    }
}

// Load environment variables
require('dotenv').config();

// Run the test
testCloudinaryConnection();
