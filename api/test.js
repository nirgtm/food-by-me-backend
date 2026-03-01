// Simple test endpoint
module.exports = (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
};
