module.exports = {
  cron: [
    '0 */6 * * *', // Run every 6 hours
    'curl $VERCEL_URL/api/sync-products'
  ]
};

