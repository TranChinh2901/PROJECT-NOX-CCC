import { createHash, randomUUID } from 'crypto';
import { IncomingMessage, Server } from 'http';
import { URL } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';
import authService from '@/modules/auth/auth.service';
import { container } from '../di/container';
import { logger } from '@/utils/logger';
import { isRequestOriginAllowed } from '@/utils/origin';

type AuthenticatedSocketRequest = IncomingMessage & {
  user?: {
    id: number;
    email: string;
    role: string;
  };
};

type ClientMessage =
  | {
      type: 'ping' | 'subscribe';
      payload?: unknown;
      timestamp?: number;
    }
  | {
      type: 'mark_read';
      payload?:
        | { notificationId?: number | string; notificationIds?: Array<number | string> }
        | number
        | string;
      timestamp?: number;
    };

const SOCKET_PATH = '/ws/notifications';

const createSocketEmitter = (socket: WebSocket) => ({
  emit(event: string, data: unknown) {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: event,
        payload: data,
        timestamp: Date.now(),
      }),
    );
  },
  disconnect() {
    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
      return;
    }
    socket.close(1000, 'Server disconnect');
  },
});

const getRequestOriginAllowed = (request: IncomingMessage): boolean => {
  const origin = request.headers.origin;
  return Array.isArray(origin) ? false : isRequestOriginAllowed(origin);
};

const normalizeNotificationIds = (payload: ClientMessage['payload']): number[] => {
  if (!payload) return [];

  if (typeof payload === 'string' || typeof payload === 'number') {
    const parsed = Number(payload);
    return Number.isInteger(parsed) && parsed > 0 ? [parsed] : [];
  }

  if (typeof payload === 'object' && payload !== null) {
    const readPayload = payload as {
      notificationId?: number | string;
      notificationIds?: Array<number | string>;
    };
    const single = readPayload.notificationId !== undefined
      ? Number(readPayload.notificationId)
      : NaN;
    if (Number.isInteger(single) && single > 0) {
      return [single];
    }

    const many = Array.isArray(readPayload.notificationIds)
      ? readPayload.notificationIds
          .map((value: number | string) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      : [];

    return many;
  }

  return [];
};

export const attachNotificationWebSocketGateway = (server: Server): void => {
  const webSocketService = container.getWebSocketService();
  const notificationRepository = container.getNotificationRepository();
  const markAsReadUseCase = container.getMarkAsReadUseCase();
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', async (socket: WebSocket, request: AuthenticatedSocketRequest) => {
    const user = request.user;
    if (!user) {
      socket.close(1008, 'Authentication required');
      return;
    }

    const socketId = randomUUID();
    const socketEmitter = createSocketEmitter(socket);
    webSocketService.registerConnection(user.id, socketId, socketEmitter);

    logger.log(`WebSocket connected for user ${user.id} (${socketId})`);

    socketEmitter.emit('connected', {
      socketId,
      userId: user.id,
    });

    try {
      const unreadCount = await notificationRepository.countUnread(user.id);
      await webSocketService.sendUnreadCount(user.id, unreadCount);
    } catch (error) {
      logger.error(
        `Failed to send initial unread count for user ${user.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    socket.on('message', async (rawData: RawData) => {
      try {
        const message = JSON.parse(rawData.toString()) as ClientMessage;

        switch (message.type) {
          case 'ping':
            webSocketService.updatePing(user.id, socketId);
            socketEmitter.emit('pong', null);
            return;

          case 'subscribe': {
            webSocketService.updatePing(user.id, socketId);
            const unreadCount = await notificationRepository.countUnread(user.id);
            await webSocketService.sendUnreadCount(user.id, unreadCount);
            return;
          }

          case 'mark_read': {
            const notificationIds = normalizeNotificationIds(message.payload);
            if (notificationIds.length === 0) return;

            if (notificationIds.length === 1) {
              await markAsReadUseCase.execute({
                userId: user.id,
                notificationId: notificationIds[0],
              });
              return;
            }

            await markAsReadUseCase.executeMany({
              userId: user.id,
              notificationIds,
            });
            return;
          }

          default:
            socketEmitter.emit('error', 'Unsupported websocket event');
        }
      } catch (error) {
        socketEmitter.emit(
          'error',
          error instanceof Error ? error.message : 'Invalid websocket payload',
        );
      }
    });

    socket.on('close', () => {
      webSocketService.removeConnection(user.id, socketId);
      logger.log(`WebSocket disconnected for user ${user.id} (${socketId})`);
    });

    socket.on('error', (error: Error) => {
      logger.error(
        `WebSocket error for user ${user.id} (${socketId}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      webSocketService.removeConnection(user.id, socketId);
    });
  });

  server.on('upgrade', (request: AuthenticatedSocketRequest, socket, head) => {
    const requestUrl = new URL(request.url || '/', 'http://localhost');

    if (requestUrl.pathname !== SOCKET_PATH) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    if (!getRequestOriginAllowed(request)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    const token = requestUrl.searchParams.get('token');
    const decoded = token ? authService.verifyToken(token) : null;

    if (!decoded) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    request.user = decoded;

    const maskedToken = token
      ? createHash('sha256').update(token).digest('hex').slice(0, 12)
      : 'missing-token';
    logger.log(`WebSocket upgrade accepted for user ${decoded.id} (${maskedToken})`);

    wss.handleUpgrade(request, socket, head, (websocket: WebSocket) => {
      wss.emit('connection', websocket, request);
    });
  });
};
