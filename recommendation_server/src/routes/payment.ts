import { Router } from 'express';
import momoController from '@/modules/payments/momo.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { asyncHandle } from '@/utils/handle-error';

const router = Router();

router.post('/momo/create', authMiddleware(), asyncHandle(momoController.createPayment));
router.post('/momo/ipn', asyncHandle(momoController.ipn));

export default router;
