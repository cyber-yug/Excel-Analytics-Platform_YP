// Catch-all API route handler for Vercel
const app = require('../backend/index.js');

module.exports = (req, res) => {
    // Vercel strips /api from the URL, so we need to add it back
    // since our backend expects routes like /api/auth, /api/upload, etc.
    req.url = '/api' + req.url;
    
    // Forward the request to our Express app
    return app(req, res);
};
