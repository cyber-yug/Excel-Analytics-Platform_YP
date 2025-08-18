// Vercel Serverless Function Handler for all API routes
// This catches all /api/* routes and forwards them to your Express app

const app = require('../backend/index.js');

// Export as serverless function handler
module.exports = (req, res) => {
    // Forward all requests to the Express app
    return app(req, res);
};
