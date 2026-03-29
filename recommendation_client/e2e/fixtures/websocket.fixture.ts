/**
 * WebSocket Test Fixtures
 * Mock WebSocket server for testing real-time notifications
 */

export class MockWebSocketServer {
  private connections: Map<string, MockConnection> = new Map();
  private messageHandlers: Map<string, MockMessageHandler> = new Map();

  connect(userId: string, token: string): void {
    if (!this.validateToken(token)) {
      throw new Error('Invalid token');
    }

    this.connections.set(userId, {
      userId,
      token,
      connected: true,
      rooms: [`user:${userId}`],
    });
  }

  disconnect(userId: string): void {
    this.connections.delete(userId);
  }

  emit(userId: string, event: string, data: unknown): void {
    const connection = this.connections.get(userId);

    if (!connection) {
      throw new Error('User not connected');
    }

    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  on(event: string, handler: MockMessageHandler): void {
    this.messageHandlers.set(event, handler);
  }

  broadcast(event: string, data: unknown): void {
    this.connections.forEach((_connection, userId) => {
      this.emit(userId, event, data);
    });
  }

  isConnected(userId: string): boolean {
    return this.connections.has(userId);
  }

  private validateToken(token: string): boolean {
    return token.startsWith('valid-token-');
  }

  reset(): void {
    this.connections.clear();
    this.messageHandlers.clear();
  }
}

export const createMockWebSocketServer = () => new MockWebSocketServer();

interface MockConnection {
  userId: string;
  token: string;
  connected: boolean;
  rooms: string[];
}

type MockMessageHandler = (data: unknown) => void;
