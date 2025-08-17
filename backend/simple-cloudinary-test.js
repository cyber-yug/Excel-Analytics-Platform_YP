require('dotenv').config();

console.log('🌤️  Cloudinary Environment Check:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set ✅' : 'Missing ❌');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set ✅' : 'Missing ❌');

// Simple cloudinary test
try {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    console.log('\n🔌 Testing Cloudinary API...');
    
    cloudinary.api.ping()
        .then(result => {
            console.log('✅ Cloudinary connection successful!');
            console.log('Response:', result);
        })
        .catch(error => {
            console.error('❌ Cloudinary connection failed:');
            console.error('Error:', error.message);
            console.error('HTTP Code:', error.http_code);
        });
        
} catch (error) {
    console.error('❌ Error loading Cloudinary:', error.message);
}
