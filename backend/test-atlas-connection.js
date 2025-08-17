const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
    try {
        console.log('🔗 Attempting to connect to MongoDB Atlas...');
        console.log('Connection string:', process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            connectTimeoutMS: 10000,
        });
        
        console.log('✅ MongoDB Atlas connection successful!');
        
        // Test creating a simple document
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);
        
        const testDoc = new TestModel({ test: 'MongoDB Atlas connection working!' });
        await testDoc.save();
        console.log('✅ Test document saved successfully');
        
        // Clean up test document
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Test document cleaned up');
        
        await mongoose.connection.close();
        console.log('✅ Connection closed successfully');
        
    } catch (error) {
        console.error('❌ MongoDB Atlas connection failed:', error.message);
        if (error.message.includes('authentication')) {
            console.log('💡 Check your username and password in the connection string');
        }
        if (error.message.includes('network')) {
            console.log('💡 Check your network access settings in MongoDB Atlas');
        }
        process.exit(1);
    }
}

testMongoConnection();
