const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🚀 Configurando proxy para API de TCG...');
  
  app.use(
    '/api/tcg',
    createProxyMiddleware({
      target: 'https://www.apitcg.com',
      changeOrigin: true,
      secure: true,
      followRedirects: true,
      pathRewrite: {
        '^/api/tcg': '/api'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('📡 Proxy request:', req.url);
        proxyReq.setHeader('x-api-key', 'dfdafe3318674ef4614e77913b6e2b85f80433d413f03c082503edb68d77ef2b');
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Content-Type', 'application/json');
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📥 Proxy response:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err);
      },
      logLevel: 'debug'
    })
  );
  
  console.log('✅ Proxy configurado para /api/tcg -> https://www.apitcg.com/api');
};