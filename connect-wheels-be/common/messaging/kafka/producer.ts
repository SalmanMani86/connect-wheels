import { createProducer } from "./kafka-client";

export const publishEvent = async (topic: string, message: object) => {
  const producer = createProducer();
  let connected = false;

  try {
    await producer.connect();
    connected = true;

    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });

    console.log(`Event published to topic ${topic}`, message);
  } catch (error) {
    console.error(`Failed to publish event to topic ${topic}:`, error);
    throw error;
  } finally {
    if (connected) {
      await producer
        .disconnect()
        .catch((err: Error) =>
          console.error("Failed to disconnect producer:", err)
        );
    }
  }
};
