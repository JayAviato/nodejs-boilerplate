/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOCKET SERVICE PORT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Defines the interface for real-time communication.
 * The application layer uses this to broadcast events without knowing
 * about Socket.io or any specific implementation.
 */

export interface ISocketService {
    /**
     * Broadcast a message to all connected clients
     * @param event The event name
     * @param data The payload
     */
    broadcast(event: string, data: unknown): void;

    /**
     * Send a message to a specific room
     * @param room The room name
     * @param event The event name
     * @param data The payload
     */
    to(room: string, event: string, data: unknown): void;

    /**
     * Get the count of connected clients
     */
    getConnectionCount(): number;
}
