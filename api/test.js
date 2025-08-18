// Simple test API function to verify backend deployment
module.exports = (req, res) => {
    res.json({ 
        message: "Backend is working!", 
        timestamp: new Date().toISOString(),
        path: req.url 
    });
};
