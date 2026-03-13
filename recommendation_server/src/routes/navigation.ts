import { Router } from 'express';
import navigationController from '@/modules/navigation/navigation.controller';

const router = Router();

router.get('/header', navigationController.getHeaderNavigation);

export default router;
