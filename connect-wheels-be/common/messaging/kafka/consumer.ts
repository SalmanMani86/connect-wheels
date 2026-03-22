import { createConsumer } from './kafka-client';

const KafkaConsumer = async ({
  groupId,
  topic,
  handleMessage,
}: {
  groupId: string;
  topic: string;
  handleMessage: (message: any) => Promise<void>;
}) => {
  const consumer = createConsumer(groupId);

  try {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const messagePayloadString = message.value?.toString();
          if (!messagePayloadString) {
            console.warn('Received empty message');
            return;
          }

          const parsedMessage = JSON.parse(messagePayloadString);
          await handleMessage(parsedMessage);
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
        }
      },
    });

    console.log(`Consumer running on topic: ${topic}`);
  } catch (err) {
    console.error(`Failed to start consumer for topic ${topic}:`, err);
    throw err;
  }
};

export default KafkaConsumer