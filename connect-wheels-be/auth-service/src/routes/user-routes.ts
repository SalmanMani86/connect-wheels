import { deleteUserValidator } from "../validators/user-validator";
import userController from "../controller/user-contoller";


const userRouter = require('express').Router();



// user routes
userRouter.get('/all', userController.getAllUsers);
userRouter.delete('/delete-user',[deleteUserValidator], userController.deleteUserByID);


export default userRouter;