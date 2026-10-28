require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/suppliers');
const vendorRoutes = require('./routes/vendors');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit:'100kb' }));
app.use('/api/auth', rateLimit({ windowMs:15*60*1000, limit:40, standardHeaders:true, legacyHeaders:false }));
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/health', (_req,res) => res.json({ status:'ok', service:'vendor-supplier-management-portal', time:new Date().toISOString() }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/{*splat}', (_req,res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.use((err, _req, res, _next) => {
  console.error('Request failed:', err.message);
  const message = process.env.NODE_ENV === 'production'
    ? 'The request could not be completed. Check the server configuration and try again.'
    : (err.message || 'Unexpected server error.');
  res.status(500).json({ error:message });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Vendor & Supplier Portal running at http://localhost:${port}`));
