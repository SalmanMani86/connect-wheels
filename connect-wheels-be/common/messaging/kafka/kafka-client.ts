// import { Kafka, Consumer, Producer } from 'kafkajs';

// const kafka = new Kafka({
//   clientId: 'connectwheels',
//   brokers: ['localhost:9092'],
// });

// export const createProducer = (): Producer => kafka.producer();
// export const createConsumer = (groupId: string): Consumer => kafka.consumer({ groupId });

import { Kafka, Consumer, Producer } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'connectwheels',
  brokers: ['localhost:9092'],
});

export const createProducer = (): Producer => kafka.producer();
export const createConsumer = (groupId: string): Consumer => kafka.consumer({ groupId });
