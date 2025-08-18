const axios = require('axios');

const BASE_URL = 'http://192.168.1.21:3001/api';

// Test data
const testUser = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
};

const loginData = {
    emailOrUsername: 'test@example.com',
    password: 'password123',
    keepLoggedIn: false
};

async function testUserRegistrationAndLogin() {
    try {
        console.log('🧪 Starting User Registration and Login Test...\n');

        // Test 1: User Registration
        console.log('📝 Testing User Registration...');
        try {
            const registerResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
            console.log('✅ Registration successful!');
            console.log('User ID:', registerResponse.data.user._id);
            console.log('Access Token received:', registerResponse.data.accessToken ? 'Yes' : 'No');
            console.log('User stored in Atlas:', registerResponse.data.user.email);
            
            // Save token for further tests
            global.accessToken = registerResponse.data.accessToken;
            
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('⚠️  User already exists, proceeding with login test...');
            } else {
                console.error('❌ Registration failed:', error.response?.data || error.message);
                return;
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: User Login
        console.log('🔐 Testing User Login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
            console.log('✅ Login successful!');
            console.log('User ID:', loginResponse.data.user._id);
            console.log('Last Login updated:', loginResponse.data.user.lastLogin);
            console.log('Access Token received:', loginResponse.data.accessToken ? 'Yes' : 'No');
            
            global.accessToken = loginResponse.data.accessToken;
            global.cookies = loginResponse.headers['set-cookie'];
            
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            return;
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Get User Info (Protected Route)
        console.log('👤 Testing Protected Route (Get User Info)...');
        try {
            const userInfoResponse = await axios.get(`${BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${global.accessToken}`
                }
            });
            console.log('✅ Protected route access successful!');
            console.log('User Info retrieved:', userInfoResponse.data.user.email);
            console.log('Username:', userInfoResponse.data.user.username);
            
        } catch (error) {
            console.error('❌ Protected route access failed:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 4: Token Refresh
        console.log('🔄 Testing Token Refresh...');
        try {
            const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                headers: {
                    'Cookie': global.cookies ? global.cookies.join('; ') : ''
                }
            });
            console.log('✅ Token refresh successful!');
            console.log('New Access Token received:', refreshResponse.data.accessToken ? 'Yes' : 'No');
            
        } catch (error) {
            console.error('❌ Token refresh failed:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 5: Logout
        console.log('🚪 Testing User Logout...');
        try {
            const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
                headers: {
                    'Cookie': global.cookies ? global.cookies.join('; ') : ''
                }
            });
            console.log('✅ Logout successful!');
            console.log('Message:', logoutResponse.data.message);
            
        } catch (error) {
            console.error('❌ Logout failed:', error.response?.data || error.message);
        }

        console.log('\n🎉 All authentication tests completed!');
        console.log('📊 Check your MongoDB Atlas dashboard to see the stored user data and refresh tokens.');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

// Run the test
testUserRegistrationAndLogin();
