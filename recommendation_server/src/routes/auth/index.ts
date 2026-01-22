import { Router } from 'express';
import authController from '@/modules/auth/auth.controller';
import { LoginSchema, UpdateProfileSchema } from '@/modules/auth/schema/login.schema';
import { RegisterSchema } from '@/modules/auth/schema/signup.chema';
import { authMiddleware, requireAdmin } from '@/middlewares/auth.middleware';
import { validateBody } from '@/middlewares/validate.middleware';
import { uploadAvatar } from '@/middlewares/upload.middleware';
import { asyncHandle } from '@/utils/handle-error';

const router = Router();

router.post('/register', 
  // validateBody(RegisterSchema), 
  asyncHandle(authController.register)
);

router.post('/login', 
  validateBody(LoginSchema), 
  asyncHandle(authController.login)
);

router.post('/refresh-token', 
  asyncHandle(authController.refreshToken)
);

router.post('/logout', 
  authMiddleware, 
  asyncHandle(authController.logout)
);

router.get('/profile', 
  authMiddleware(), 
  asyncHandle(authController.getProfile)
);

router.get('/users',
  // authMiddleware(),
  asyncHandle(authController.getAllUsers)
);

router.put('/profile', 
  authMiddleware(),
  validateBody(UpdateProfileSchema),
  asyncHandle(authController.updateProfile)
);

router.delete('/delete-account/:id',
  // authMiddleware(),
  asyncHandle(authController.deleteAccount)
);

router.delete('/users/:id',
  // authMiddleware(),
  // requireAdmin(),
  asyncHandle(authController.deleteUserById)
);

router.put('/users/:id',
  // authMiddleware(),
  // requireAdmin(),
  asyncHandle(authController.updateUserById)
);

router.put('/upload-avatar',
  authMiddleware(),
  uploadAvatar.single('avatar'),
  asyncHandle(authController.uploadAvatar)
);

export default router;