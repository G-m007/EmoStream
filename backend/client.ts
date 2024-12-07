import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["192.168.1.2:9092"],
});
