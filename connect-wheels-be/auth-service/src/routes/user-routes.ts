import { deleteUserValidator, updateProfileValidator, changePasswordValidator } from "../validators/user-validator";
import userController from "../controller/user-contoller";
import { authenticateJWT } from "../../../common/auth-middleware/auth_middleware";

const userRouter = require('express').Router();

// Public
userRouter.get('/all', userController.getAllUsers);

// Protected (auth required)
userRouter.get('/profile', authenticateJWT, userController.getProfile);
userRouter.put('/profile', authenticateJWT, updateProfileValidator, userController.updateProfile);
userRouter.put('/change-password', authenticateJWT, changePasswordValidator, userController.changePassword);

userRouter.delete('/delete-user', deleteUserValidator, userController.deleteUserByID);

export default userRouter;