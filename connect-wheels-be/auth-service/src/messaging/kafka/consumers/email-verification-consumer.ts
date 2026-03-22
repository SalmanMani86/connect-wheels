import KafkaConsumer from "../../../../../common/messaging/kafka/consumer";
import { AUTH_EMAIL_VERIFICATION } from "../../../../../common/messaging/kafka/topics";
import { sendVerificationEmail } from "../../../service/email-service";

const FRONTEND_VERIFY_URL =
  process.env.FRONTEND_VERIFY_EMAIL_URL || "http://localhost:5173/verify-email";

export const startEmailVerificationConsumer = async () => {
  await KafkaConsumer({
    groupId: "auth-email-verification-worker",
    topic: AUTH_EMAIL_VERIFICATION,
    handleMessage: async (message: { userId: number; email: string; token: string }) => {
      const { email, token } = message;
      const link = `${FRONTEND_VERIFY_URL}?token=${token}`;
      try {
        await sendVerificationEmail(email, link);
        console.log("[email-verification-worker] Verification email sent to", email);
      } catch (err) {
        console.error("[email-verification-worker] Failed to send verification email:", err);
        throw err;
      }
    },
  });
};
