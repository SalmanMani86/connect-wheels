import { startEmailVerificationConsumer } from "./email-verification-consumer";

const startAllConsumers = async () => {
  try {
    await startEmailVerificationConsumer();
    console.log("[auth-service] Kafka email verification consumer is running");
  } catch (error) {
    console.error("[auth-service] Error starting Kafka consumers:", error);
  }
};

export default startAllConsumers;
