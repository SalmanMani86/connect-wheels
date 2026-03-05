import { Request, Response } from 'express';
import userService from '../service/user-service';
import { validationResult } from 'express-validator';
import { authenticateJWT, AuthRequest } from '../../../common/auth-middleware/auth_middleware';


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

const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId ?? req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Authentication required' });
        const user = await userService.getProfile(Number(userId));
        return res.status(200).json(user);
    } catch (error: any) {
        if (error?.message === 'User not found') return res.status(404).json({ message: error.message });
        console.error('getProfile error:', error);
        return res.status(500).json({ message: 'Error fetching profile' });
    }
};

const updateProfile = async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const userId = req.user?.userId ?? req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Authentication required' });
        const data = { firstName: req.body.firstName, lastName: req.body.lastName };
        const user = await userService.updateProfile(Number(userId), data);
        return res.status(200).json(user);
    } catch (error: any) {
        if (error?.message === 'User not found') return res.status(404).json({ message: error.message });
        console.error('updateProfile error:', error);
        return res.status(500).json({ message: 'Error updating profile' });
    }
};

const changePassword = async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const userId = req.user?.userId ?? req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Authentication required' });
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(Number(userId), currentPassword || '', newPassword);
        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error: any) {
        if (error?.message === 'Current password is incorrect') return res.status(400).json({ message: error.message });
        console.error('changePassword error:', error);
        return res.status(500).json({ message: error?.message || 'Error changing password' });
    }
};

export default {
    getAllUsers,
    deleteUserByID,
    getProfile,
    updateProfile,
    changePassword,
};

