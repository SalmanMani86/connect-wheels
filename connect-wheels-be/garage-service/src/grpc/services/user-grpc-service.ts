import { userClient } from '../clients/user-client';

const USE_GRPC = process.env.USE_GRPC !== 'false';

const checkUserHttp = async (userId: number): Promise<boolean> => {
  const baseUrl = process.env.AUTH_SERVICE_HTTP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/user/internal/exists/${userId}`);
    if (!res.ok) {
      console.error('[checkUserHttp] non-2xx', res.status);
      return false;
    }
    const data: any = await res.json();
    return !!data.exists;
  } catch (err) {
    console.error('[checkUserHttp] error:', err);
    return false;
  }
};

// CheckUser RPC: gRPC by default, HTTP fallback when USE_GRPC=false.
// On Render free tier we set USE_GRPC=false because only one public port is available per service.
export const checkUserGrpc = (userId: number): Promise<boolean> => {
  if (!USE_GRPC) {
    return checkUserHttp(userId);
  }

  return new Promise((resolve, reject) => {
    userClient.CheckUser({ userId }, (error: any, response: any) => {
      if (error) {
        console.error('gRPC CheckUser error:', error);
        return reject(error);
      }
      resolve(response.exists);
    });
  });
};



