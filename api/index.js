// Vercel serverless entry point — wraps the same Express app used for local
// dev (server/index.js). vercel.json rewrites /api/* here.
module.exports = require('../server/index.js');
