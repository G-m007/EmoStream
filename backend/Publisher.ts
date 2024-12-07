import WebSocket from 'ws';
import { Subscriber } from './Subscriber';

export class Publisher {
  private subscribers: Subscriber[] = [];

  addSubscriber(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
    console.log(`Added subscriber ${subscriber.getId()}. Total subscribers: ${this.subscribers.length}`);
  }

  removeSubscriber(subscriberId: string): void {
    this.subscribers = this.subscribers.filter(sub => sub.getId() !== subscriberId);
    console.log(`Removed subscriber ${subscriberId}. Total subscribers: ${this.subscribers.length}`);
  }

  findAvailableSubscriber(): Subscriber | null {
    return this.subscribers.find(subscriber => subscriber.canAcceptClient()) || null;
  }

  broadcast(message: string): void {
    this.subscribers.forEach(subscriber => {
      subscriber.broadcast(message);
    });
  }
} 