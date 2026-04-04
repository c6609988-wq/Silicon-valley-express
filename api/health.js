// api/health.js → GET /api/health
module.exports = (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
};
