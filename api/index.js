// Vercel serverless function entry point
const app = require('../server');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  return app(req, res);
};
