import controller from "../controller/auth-controller";
import { loginValidator, registerValidator } from "../validators/auth-validator";
import { deleteUserValidator } from "../validators/user-validator";
import userController from "../controller/user-contoller";

const router = require('express').Router();

//public routes
router.post('/register', registerValidator, controller.registerUser);
router.post('/login', loginValidator, controller.loginUser);
router.get('/verify-email', controller.verifyEmail);

//google routes
router.get('/google', controller.getGoogleAuthUrl);
router.get('/google/callback', controller.handleGoogleCallback);

// user routes
router.delete('/delete-user', deleteUserValidator, userController.deleteUserByID);



export default router;