// import { Kafka, Consumer, Producer } from 'kafkajs';

// const kafka = new Kafka({
//   clientId: 'connectwheels',
//   brokers: ['localhost:9092'],
// });

// export const createProducer = (): Producer => kafka.producer();
// export const createConsumer = (groupId: string): Consumer => kafka.consumer({ groupId });

import { Kafka, Consumer, Producer } from 'kafkajs';

// When running services locally on the host with Docker Compose,
// Kafka is exposed on localhost:29092 (see docker-compose.yml).
// Allow override via env but default to that host:port.
const broker = process.env.KAFKA_BROKER || 'localhost:29092';

const kafka = new Kafka({
  clientId: 'connectwheels',
  brokers: [broker],
});

export const createProducer = (): Producer => kafka.producer();
export const createConsumer = (groupId: string): Consumer =>
  kafka.consumer({ groupId });
