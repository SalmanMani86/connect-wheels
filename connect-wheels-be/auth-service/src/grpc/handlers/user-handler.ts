import userService from '../../service/user-service';
import * as grpc from '@grpc/grpc-js';

export const checkUser = async (call: any, callback: any) => {
    try {
        const userId = Number(call.request.userId);
        const user = await userService.findUserById(userId);
        callback(null, { exists: !!user });
    } catch (error) {
        console.error(error);
        callback({ code: grpc.status.INTERNAL, message: 'Server error' });
    }
};

