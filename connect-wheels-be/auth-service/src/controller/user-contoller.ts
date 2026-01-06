import { Request, Response } from 'express';
import { USER_DELETED } from '../../../common/messaging/kafka/topics';
import userService from '../service/user-service';
import { validationResult } from 'express-validator';
//import { publishEvent } from '../../../common/messaging/kafka/producer';


const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json({
            message: 'Users retrieved successfully',
            users: users,
            count: users.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            message: 'Error fetching users',
            error: error
        });
    }
};

const deleteUserByID = async (req: Request, res: Response) => {
    // Validation request inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.body.userID
    try {
        const deleted = await userService.deleteUserByID(userId);
        if (!deleted) {
            return res.status(404).json({
                message: `User with ID ${userId} not found`
            });
        }

       // await publishEvent(USER_DELETED, { userId });

        return res.status(200).json({
            message: 'User deleted successfully',
            userId
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            message: 'Error deleting user',
            error: error
        });
    }
};

export default {
    getAllUsers,
    deleteUserByID
};

