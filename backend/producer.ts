import { kafka } from "./client";
import { default as express } from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { Publisher } from './Publisher';
import { Subscriber } from './Subscriber';

const app = express();
const port = 3000;
const INITIAL_SUBSCRIBERS = 3; // Start with 3 subscribers

app.use(express.json());
app.use(cors());

async function init() {
  const producer = kafka.producer();
  const wss = new WebSocketServer({ noServer: true });
  const publisher = new Publisher();

  // Initialize subscribers
  for (let i = 0; i < INITIAL_SUBSCRIBERS; i++) {
    publisher.addSubscriber(new Subscriber(`subscriber-${i + 1}`));
  }

  console.log("Connecting Producer");
  await producer.connect();
  console.log("Producer Connected Successfully");

  // WebSocket handling
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client attempting to connect");

    // Find available subscriber
    const subscriber = publisher.findAvailableSubscriber();
    
    if (!subscriber) {
      console.log("No available subscribers. Connection rejected.");
      ws.close();
      return;
    }

    // Add client to subscriber
    subscriber.addClient(ws);
    console.log(`Client connected to subscriber ${subscriber.getId()}`);

    ws.on("close", () => {
      subscriber.removeClient(ws);
      console.log(`Client disconnected from subscriber ${subscriber.getId()}`);
    });

    ws.on("message", async (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === "emoji") {
        try {
          // Send to Kafka
          await producer.send({
            topic: "emoji-stream",
            messages: [
              {
                value: JSON.stringify({
                  user_id: data.userId,
                  emoji: data.emoji,
                  timestamp: data.timestamp,
                }),
              },
            ],
          });

          // Broadcast to all subscribers
          publisher.broadcast(JSON.stringify(data));

        } catch (error) {
          console.error("Producer error:", error);
        }
      } else if (data.type === "emotion_result") {
        // Broadcast emotion result to all subscribers
        publisher.broadcast(JSON.stringify({
          type: "emotion_result",
          emoji: data.emoji,
          timestamp: data.timestamp,
          stats: data.stats
        }));
      }
    });
  });

  // Regular HTTP endpoints
  app.post("/emoji", async (req: express.Request, res: express.Response) => {
    const { user_id, emoji, timestamp } = req.body;

    try {
      await producer.send({
        topic: "emoji-stream",
        messages: [
          {
            value: JSON.stringify({ user_id, emoji, timestamp }),
          },
        ],
      });

      // Broadcast to all subscribers
      publisher.broadcast(
        JSON.stringify({ type: "emoji", userId: user_id, emoji, timestamp })
      );

      res.status(200).json({ message: "Emoji sent successfully" });
    } catch (error) {
      console.error("Producer error:", error);
      res.status(500).json({ error: "Failed to send emoji", details: error });
    }
  });

  // Add endpoint to get subscriber stats
  app.get("/stats", (req: express.Request, res: express.Response) => {
    const stats = {
      totalSubscribers: 0,
      subscriberStats: [] as any[]
    };
    res.json(stats);
  });

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Attach WebSocket server to HTTP server
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
}

init().catch(console.error);
