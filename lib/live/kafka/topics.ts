export const TOPICS = {
  GAME_EVENTS: 'sports.game-events',
  GAME_STATE: 'sports.game-state',
  ODDS_UPDATES: 'sports.odds-updates',
  TELEMETRY: 'sports.telemetry',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];

export interface KafkaMessageEnvelope<T> {
  key: string;
  timestamp: number;
  provider?: string;
  payload: T;
}

export interface GameEventPayload {
  gameId: string;
  league: string;
  eventType: string;
  data: Record<string, unknown>;
}

export interface GameStatePayload {
  gameId: string;
  league: string;
  state: Record<string, unknown>;
}

export interface OddsUpdatePayload {
  gameId: string;
  league: string;
  provider: string;
  moneyline?: { home?: number; away?: number };
  spread?: { home?: number; away?: number };
  total?: { line?: number; over?: number; under?: number };
}

export type KafkaPayload =
  | KafkaMessageEnvelope<GameEventPayload>
  | KafkaMessageEnvelope<GameStatePayload>
  | KafkaMessageEnvelope<OddsUpdatePayload>;

export interface KafkaConsumer {
  subscribe(topics: TopicName[]): Promise<void>;
  onMessage(handler: (message: KafkaPayload) => Promise<void> | void): void;
  disconnect(): Promise<void>;
}

export interface KafkaProducer {
  connect(): Promise<void>;
  send(topic: TopicName, message: KafkaPayload): Promise<void>;
  disconnect(): Promise<void>;
}

export interface KafkaFactory {
  createProducer(): KafkaProducer;
  createConsumer(groupId: string): KafkaConsumer;
}

export let kafkaFactory: KafkaFactory | null = null;

export function registerKafkaFactory(factory: KafkaFactory) {
  kafkaFactory = factory;
}

export function ensureKafkaFactory(): KafkaFactory {
  if (!kafkaFactory) {
    throw new Error('Kafka factory not registered');
  }
  return kafkaFactory;
}
