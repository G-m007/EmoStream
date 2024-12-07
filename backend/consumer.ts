import { kafka } from "./client";
const group = process.argv[2];

async function init() {
  const consumer = kafka.consumer({ groupId: group });
  await consumer.connect();

  await consumer.subscribe({ topics: ["emoji-stream"], fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      if (message.value) {
        const messageData = JSON.parse(message.value.toString());
        console.log(`${group}: [${topic}]: PART:${partition}:`, messageData);
      }
    },
  });
}

init();
