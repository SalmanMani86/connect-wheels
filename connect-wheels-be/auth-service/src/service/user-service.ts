import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../entity/user';

const findUserById = async (userId: number) => {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: userId });
        if (!user) {
            return false
        }
        return true;
    } catch (error) {
        throw error;
    }
};

const getUserDetails = async (userId: number) => {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: userId });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        throw error
    }
};

const deleteUserByID = async (userId: number) => {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const deleteResult = await userRepo.delete({ id: userId });
        if (deleteResult.affected === 0) {
            throw new Error("User not found");
        }

        return true

    } catch (error) {
        throw error;
    }
};

const getAllUsers = async () => {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const users = await userRepo.find();
        return users;
    } catch (error) {
        throw error;
    }
};

const getProfile = async (userId: number) => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
        where: { id: userId },
        select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'googleId'],
    });
    if (!user) throw new Error('User not found');
    return user;
};

const updateProfile = async (userId: number, data: { firstName?: string; lastName?: string }) => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    await userRepo.save(user);
    return getProfile(userId);
};

const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.password) {
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new Error('Current password is incorrect');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await userRepo.save(user);
    return { message: 'Password updated successfully' };
};

const userService = {
    deleteUserByID,
    findUserById,
    getUserDetails,
    getAllUsers,
    getProfile,
    updateProfile,
    changePassword,
}

export default userService
