/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOCKET.IO SERVICE ADAPTER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implementation of ISocketService using Socket.io.
 * Handles connection events and broadcasting.
 */

import { Server as SocketServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { ISocketService } from '../../application/ports/socket.port.js';
import { createLogger } from '../logging/pino.logger.js';

export class SocketIOService implements ISocketService {
    private io: SocketServer | null = null;
    private readonly logger = createLogger('SocketService');

    /**
     * Initialize the Socket.io server
     * Should be called when the HTTP server starts
     */
    initialize(httpServer: HttpServer): void {
        if (this.io) {
            this.logger.warn('Socket.io is already initialized');
            return;
        }

        this.io = new SocketServer(httpServer, {
            cors: {
                origin: '*', // Configure this properly in production
                methods: ['GET', 'POST'],
            },
        });

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });

        this.logger.info('Socket.io initialized');
    }

    private handleConnection(socket: Socket): void {
        this.logger.debug(`Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            this.logger.debug(`Client disconnected: ${socket.id}`);
        });

        // Example: Join room based on query param (e.g., userId)
        // const userId = socket.handshake.query.userId;
        // if (userId) socket.join(`user:${userId}`);
    }

    broadcast(event: string, data: unknown): void {
        if (!this.io) {
            this.logger.warn('Attempted to broadcast before initialization');
            return;
        }
        this.io.emit(event, data);
    }

    to(room: string, event: string, data: unknown): void {
        if (!this.io) {
            this.logger.warn('Attempted to send to room before initialization');
            return;
        }
        this.io.to(room).emit(event, data);
    }

    getConnectionCount(): number {
        return this.io?.engine.clientsCount ?? 0;
    }
}
