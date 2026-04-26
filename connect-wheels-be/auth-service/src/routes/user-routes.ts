import { deleteUserValidator, updateProfileValidator, changePasswordValidator } from "../validators/user-validator";
import userController from "../controller/user-contoller";
import userService from "../service/user-service";
import { authenticateJWT } from "../../../common/auth-middleware/auth_middleware";

const userRouter = require('express').Router();

// Public
userRouter.get('/all', userController.getAllUsers);

// Internal: HTTP equivalent of gRPC CheckUser (used by other services).
// Used by garage-service when USE_GRPC=false (e.g. on Render free tier).
userRouter.get('/internal/exists/:userId', async (req: any, res: any) => {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ exists: false, error: 'Invalid userId' });
    }
    const user = await userService.findUserById(userId);
    return res.json({ exists: !!user });
  } catch (err) {
    console.error('[auth] /internal/exists error:', err);
    return res.status(500).json({ exists: false, error: 'Server error' });
  }
});

// Protected (auth required)
userRouter.get('/profile', authenticateJWT, userController.getProfile);
userRouter.put('/profile', authenticateJWT, updateProfileValidator, userController.updateProfile);
userRouter.put('/change-password', authenticateJWT, changePasswordValidator, userController.changePassword);

userRouter.delete('/delete-user', deleteUserValidator, userController.deleteUserByID);

export default userRouter;