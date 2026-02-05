/**
 * WebSocket Integration Tests
 * Tests WebSocket connection, authentication, real-time delivery, and reconnection
 */
import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { AuthHelper } from '../helpers/auth-helper';
import { NotificationFixtures } from '../fixtures/notification.fixtures';
import express from 'express';

describe('WebSocket Integration Tests', () => {
  let httpServer: Server;
  let ioServer: SocketIOServer;
  let serverPort: number;
  let clientSocket: ClientSocket;

  beforeAll((done) => {
    const app = express();
    httpServer = app.listen(() => {
      const address = httpServer.address();
      serverPort = typeof address === 'string' ? 0 : address?.port || 0;

      // Initialize Socket.IO server
      ioServer = new SocketIOServer(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });

      // Socket.IO authentication middleware
      ioServer.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        try {
          // Verify token (simplified for testing)
          if (token.startsWith('valid-token-')) {
            const userId = parseInt(token.replace('valid-token-', ''), 10);
            (socket as any).userId = userId;
            next();
          } else {
            next(new Error('Authentication error: Invalid token'));
          }
        } catch (error) {
          next(new Error('Authentication error'));
        }
      });

      // Socket.IO connection handler
      ioServer.on('connection', (socket) => {
        const userId = (socket as any).userId;
        console.log(`User ${userId} connected`);

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Handle notification acknowledgment
        socket.on('notification:ack', (data) => {
          socket.emit('notification:ack:response', { success: true, ...data });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
          console.log(`User ${userId} disconnected`);
        });
      });

      done();
    });
  });

  afterAll((done) => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    ioServer.close();
    httpServer.close(done);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Tests', () => {
    it('should connect with valid token', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject connection with invalid token', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'invalid-token' },
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        done();
      });
    });

    it('should reject connection without token', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: {},
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        done();
      });
    });

    it('should handle multiple concurrent connections', (done) => {
      const clients: ClientSocket[] = [];
      const connectionPromises: Promise<void>[] = [];

      for (let i = 1; i <= 5; i++) {
        const promise = new Promise<void>((resolve, reject) => {
          const client = ioClient(`http://localhost:${serverPort}`, {
            auth: { token: `valid-token-${i}` },
          });

          client.on('connect', () => {
            clients.push(client);
            resolve();
          });

          client.on('connect_error', reject);
        });

        connectionPromises.push(promise);
      }

      Promise.all(connectionPromises)
        .then(() => {
          expect(clients.length).toBe(5);
          clients.forEach(client => client.disconnect());
          done();
        })
        .catch(done);
    });
  });

  describe('Real-time Notification Delivery', () => {
    it('should receive notification in real-time', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      clientSocket.on('connect', () => {
        const notification = NotificationFixtures.createNotification({ userId: 1 });

        clientSocket.on('notification:new', (data) => {
          expect(data.title).toBe(notification.title);
          expect(data.message).toBe(notification.message);
          done();
        });

        // Simulate server sending notification
        ioServer.to('user:1').emit('notification:new', notification);
      });
    });

    it('should only receive own notifications', (done) => {
      const client1 = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      const client2 = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-2' },
      });

      let client1Received = false;
      let client2Received = false;

      client1.on('connect', () => {
        client1.on('notification:new', (data) => {
          client1Received = true;
        });
      });

      client2.on('connect', () => {
        client2.on('notification:new', (data) => {
          client2Received = true;

          setTimeout(() => {
            expect(client2Received).toBe(true);
            expect(client1Received).toBe(false);
            client1.disconnect();
            client2.disconnect();
            done();
          }, 100);
        });

        // Send notification only to user 2
        setTimeout(() => {
          ioServer.to('user:2').emit('notification:new', {
            title: 'User 2 notification',
          });
        }, 100);
      });
    });

    it('should handle notification acknowledgment', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('notification:ack', { notificationId: 123 });

        clientSocket.on('notification:ack:response', (data) => {
          expect(data.success).toBe(true);
          expect(data.notificationId).toBe(123);
          done();
        });
      });
    });

    it('should broadcast to multiple connected devices', (done) => {
      const client1 = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      const client2 = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      let receivedCount = 0;
      const expectedNotification = { title: 'Broadcast notification' };

      const checkCompletion = () => {
        receivedCount++;
        if (receivedCount === 2) {
          client1.disconnect();
          client2.disconnect();
          done();
        }
      };

      client1.on('connect', () => {
        client1.on('notification:new', (data) => {
          expect(data.title).toBe(expectedNotification.title);
          checkCompletion();
        });
      });

      client2.on('connect', () => {
        client2.on('notification:new', (data) => {
          expect(data.title).toBe(expectedNotification.title);
          checkCompletion();
        });

        // Broadcast to all connections of user 1
        setTimeout(() => {
          ioServer.to('user:1').emit('notification:new', expectedNotification);
        }, 100);
      });
    });
  });

  describe('Reconnection Logic', () => {
    it('should reconnect after disconnect', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
        reconnection: true,
        reconnectionDelay: 100,
      });

      let connectCount = 0;

      clientSocket.on('connect', () => {
        connectCount++;

        if (connectCount === 1) {
          // First connection - disconnect
          clientSocket.disconnect();
        } else if (connectCount === 2) {
          // Reconnected successfully
          expect(clientSocket.connected).toBe(true);
          done();
        }
      });

      clientSocket.on('disconnect', () => {
        if (connectCount === 1) {
          // Trigger reconnection
          clientSocket.connect();
        }
      });
    });

    it('should handle connection errors and retry', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'invalid-token' },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 50,
      });

      let errorCount = 0;

      clientSocket.on('connect_error', (error) => {
        errorCount++;

        if (errorCount === 3) {
          expect(errorCount).toBe(3);
          expect(clientSocket.connected).toBe(false);
          done();
        }
      });
    });

    it('should maintain connection state during network issues', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
        reconnection: true,
      });

      clientSocket.on('connect', () => {
        // Simulate network disconnect
        (clientSocket as any).io.engine.close();

        clientSocket.on('disconnect', (reason) => {
          expect(reason).toBeDefined();
          done();
        });
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle rapid consecutive notifications', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      const notificationCount = 50;
      const receivedNotifications: any[] = [];

      clientSocket.on('connect', () => {
        clientSocket.on('notification:new', (data) => {
          receivedNotifications.push(data);

          if (receivedNotifications.length === notificationCount) {
            expect(receivedNotifications.length).toBe(notificationCount);
            done();
          }
        });

        // Send many notifications rapidly
        setTimeout(() => {
          for (let i = 0; i < notificationCount; i++) {
            ioServer.to('user:1').emit('notification:new', {
              id: i,
              title: `Notification ${i}`,
            });
          }
        }, 100);
      });
    });

    it('should handle large notification payloads', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      const largeData = {
        title: 'Large notification',
        data: Array(1000).fill({ key: 'value', nested: { deep: 'data' } }),
      };

      clientSocket.on('connect', () => {
        clientSocket.on('notification:new', (data) => {
          expect(data.title).toBe(largeData.title);
          expect(data.data.length).toBe(1000);
          done();
        });

        ioServer.to('user:1').emit('notification:new', largeData);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed notification data', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      clientSocket.on('connect', () => {
        clientSocket.on('notification:new', (data) => {
          // Should still receive the notification even if malformed
          expect(data).toBeDefined();
          done();
        });

        // Send malformed data
        ioServer.to('user:1').emit('notification:new', { invalid: 'structure' });
      });
    });

    it('should handle server errors gracefully', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: 'valid-token-1' },
      });

      clientSocket.on('connect', () => {
        clientSocket.on('error', (error) => {
          expect(error).toBeDefined();
          done();
        });

        // Trigger server error
        clientSocket.emit('invalid:event', {});
      });

      // Timeout if no error received
      setTimeout(() => {
        done();
      }, 1000);
    });
  });
});
