const mongoose = require('mongoose');
require('dotenv').config();

console.log('🐳 Testing Docker MongoDB connection...');
console.log('📍 URI:', process.env.MONGO_URI);
console.log('📍 Port:', process.env.PORT);

async function testConnection() {
    try {
        console.log('🔄 Attempting to connect...');
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Successfully connected to Docker MongoDB!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('🔌 Port:', mongoose.connection.port);
        
        // Test database operations
        console.log('🔄 Testing database operations...');
        const testCollection = mongoose.connection.db.collection('connectionTest');
        
        await testCollection.insertOne({
            message: 'Hello from Excel Analytics Platform!',
            timestamp: new Date(),
            source: 'Docker MongoDB Test',
            testId: Math.random()
        });
        console.log('✅ Test document inserted successfully');
        
        const doc = await testCollection.findOne({ source: 'Docker MongoDB Test' });
        console.log('✅ Test document retrieved:', doc.message);
        
        await testCollection.deleteOne({ source: 'Docker MongoDB Test' });
        console.log('✅ Test document cleaned up');
        
        // List all databases
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('📂 Available databases:', dbs.databases.map(db => db.name));
        
        console.log('🎉 All tests passed! Docker MongoDB is working perfectly!');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check if Docker is running: docker --version');
        console.log('2. Check if container exists: docker ps -a | grep mongodb');
        console.log('3. Start container: docker start mongodb-excel');
        console.log('4. Check container logs: docker logs mongodb-excel');
        console.log('5. Create new container: docker run -d --name mongodb-excel -p 27017:27017 mongo');
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 ECONNREFUSED means MongoDB is not running or not accessible');
            console.log('   Try: docker start mongodb-excel');
        }
    } finally {
        await mongoose.disconnect();
        console.log('📴 Disconnected from MongoDB');
        process.exit(0);
    }
}

testConnection();
