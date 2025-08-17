const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testUser = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
};

async function testNewAuthSystem() {
    try {
        console.log('🧪 Testing New Authentication System...\n');

        // Test 1: Health Check
        console.log('❤️  Testing Health Check...');
        try {
            const healthResponse = await axios.get(`${BASE_URL}/health`);
            console.log('✅ Health check passed:', healthResponse.data.message);
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            return;
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: User Registration
        console.log('📝 Testing User Registration...');
        try {
            const registerResponse = await axios.post(`${BASE_URL}/user/register`, testUser);
            console.log('✅ Registration successful!');
            console.log('   User ID:', registerResponse.data.user._id);
            console.log('   Token received:', registerResponse.data.token ? 'Yes' : 'No');
            console.log('   User stored:', registerResponse.data.user.email);
            
            global.token = registerResponse.data.token;
            
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('⚠️  User already exists, proceeding with login test...');
            } else {
                console.error('❌ Registration failed:', error.response?.data || error.message);
                return;
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: User Login
        console.log('🔐 Testing User Login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/user/login`, {
                emailOrUsername: testUser.email,
                password: testUser.password
            });
            console.log('✅ Login successful!');
            console.log('   User ID:', loginResponse.data.user._id);
            console.log('   Last Login updated:', loginResponse.data.user.lastLogin);
            console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
            
            global.token = loginResponse.data.token;
            
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            return;
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 4: Get Current User (Protected Route)
        console.log('👤 Testing Protected Route (Get Current User)...');
        try {
            const userResponse = await axios.get(`${BASE_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            console.log('✅ Protected route access successful!');
            console.log('   User retrieved:', userResponse.data.user.email);
            console.log('   Username:', userResponse.data.user.username);
            
        } catch (error) {
            console.error('❌ Protected route access failed:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 5: Get All Users
        console.log('📋 Testing Get All Users...');
        try {
            const allUsersResponse = await axios.get(`${BASE_URL}/user/all`);
            console.log('✅ Get all users successful!');
            console.log('   Total users:', allUsersResponse.data.count);
            console.log('   Users:', allUsersResponse.data.users.map(u => u.email).join(', '));
            
        } catch (error) {
            console.error('❌ Get all users failed:', error.response?.data || error.message);
        }

        console.log('\n🎉 All authentication tests completed!');
        console.log('📊 Check your MongoDB Atlas dashboard to see the stored user data.');
        console.log('🚀 Your new authentication system is ready to use!');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

// Run the test
testNewAuthSystem();
