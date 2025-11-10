import type { KafkaConsumer, KafkaPayload, TopicName } from '../topics';
import { TOPICS } from '../topics';

type EventHandler = (message: KafkaPayload) => Promise<void> | void;

export class GameEventConsumer {
  private consumer: KafkaConsumer;
  private handler: EventHandler | null = null;

  constructor(consumer: KafkaConsumer) {
    this.consumer = consumer;
  }

  async start(handler: EventHandler) {
    this.handler = handler;
    await this.consumer.subscribe([TOPICS.GAME_EVENTS as TopicName]);
    this.consumer.onMessage(async (message) => {
      if (!this.handler) return;
      await this.handler(message);
    });
  }

  async stop() {
    this.handler = null;
    await this.consumer.disconnect();
  }
}
