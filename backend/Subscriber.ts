import WebSocket from 'ws';

export class Subscriber {
  private static MAX_CLIENTS = 3;
  private clients: Set<WebSocket> = new Set();
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  canAcceptClient(): boolean {
    return this.clients.size < Subscriber.MAX_CLIENTS;
  }

  addClient(client: WebSocket): boolean {
    if (!this.canAcceptClient()) return false;
    this.clients.add(client);
    console.log(`Subscriber ${this.id}: Added client. Total clients: ${this.clients.size}`);
    return true;
  }

  removeClient(client: WebSocket): void {
    this.clients.delete(client);
    console.log(`Subscriber ${this.id}: Removed client. Total clients: ${this.clients.size}`);
  }

  broadcast(message: string): void {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getId(): string {
    return this.id;
  }
} 