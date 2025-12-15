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

const userService = {
    deleteUserByID,
    findUserById,
    getUserDetails,
    getAllUsers

}

export default userService
