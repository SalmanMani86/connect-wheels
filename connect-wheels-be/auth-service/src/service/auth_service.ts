import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AppDataSource } from "../data-source";
import { User } from "../entity/user";
import { CreateUserDTO } from "../dtos/createUserDto";
import { LoginUserDTO } from "../dtos/loginUserDto";


const JWT_SECRET = 'your-jwt-secret';


export const registerUser = async (user: CreateUserDTO) => {
    try {
        const userRepo = AppDataSource.getRepository(User);

        // hash password (mutating dto here is fine, or clone if you want immutability)
        user.password = await bcrypt.hash(user.password, 10);

        const newUser = userRepo.create(user);
        await userRepo.save(newUser);

        console.log("dto", user)
        return { message: "Registered Successfully" };
    } catch (error: any) {
        console.error("registerUser error:", error);
        return { message: "Error registering user", error: error.message };
    }
};


export const loginUser = async (userDto: LoginUserDTO) => {
    try {
        const userRepository = AppDataSource.getRepository(User);

        // Check if user exists
        const existingUser = await userRepository.findOne({ where: { email: userDto.email } });
        if (!existingUser) {
            throw new Error("Invalid credentials");
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(userDto.password, existingUser.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }


        // Generate JWT token
        const token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return { 
            message: "Login successful", 
            token,
            userId: existingUser.id,
            email: existingUser.email
        };
    } catch (error: any) {
        console.error("loginUser error:", error);
        return { message: "Login failed", error: error.message || error };
    }
};


// Generate JWT token (reusable for both regular and Google auth)
const generateJWT = (user: User) => {
    return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

const authService = {
    registerUser,
    loginUser,
    generateJWT,
};


export default authService;
