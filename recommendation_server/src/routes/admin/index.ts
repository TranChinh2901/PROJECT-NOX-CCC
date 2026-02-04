import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';

const router = Router();

// Apply requireAdmin to all routes
router.use(requireAdmin());

// Placeholder health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Admin router active' });
});

// TODO: Add product routes
// TODO: Add category routes
// TODO: Add brand routes
// TODO: Add user routes
// TODO: Add review routes
// TODO: Add order routes
// TODO: Add analytics routes

export default router;
