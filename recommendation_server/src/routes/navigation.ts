import { Router } from 'express';
import navigationController from '@/modules/navigation/navigation.controller';
import { asyncHandle } from '@/utils/handle-error';

const router = Router();

router.get('/header', asyncHandle(navigationController.getHeaderNavigation));

export default router;
