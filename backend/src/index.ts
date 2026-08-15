import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import marketRoutes from './routes/markets';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api/v1', routes);        // Wealth planning: accounts, goals, WHS, portfolio, AI advisor
app.use('/api', marketRoutes);     // Markets workspace: quotes, news, risk, treasury, reports, AI CFO

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'wealth-management-system-api' });
});

// 404 for unmatched API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wealth Management System API running on http://localhost:${PORT}`);
  console.log(`- Wealth planning:  http://localhost:${PORT}/api/v1`);
  console.log(`- Markets:          http://localhost:${PORT}/api`);
});

export default app;
