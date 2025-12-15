"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseRealtimeOptions {
    /** Room IDs to join */
    channels: string[];
    /** Events to listen for, e.g. ["chat.message", "chat.destroy"] */
    events: string[];
    /** Callback when data is received */
    onData: (event: string, data: unknown) => void;
    /** Socket server URL (defaults to localhost:3001) */
    serverUrl?: string;
}

/**
 * React hook to connect to the realtime Socket.IO server and listen for events.
 *
 * @example
 * useRealtime({
 *   channels: [roomId],
 *   events: ["chat.message", "chat.destroy"],
 *   onData: (event, data) => {
 *     if (event === "chat:message") {
 *       // Handle new message
 *     }
 *   }
 * });
 */
export function useRealtime({
    channels,
    events,
    onData,
    serverUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
}: UseRealtimeOptions) {
    const socketRef = useRef<Socket | null>(null);
    const onDataRef = useRef(onData);

    const channelsKey = channels.join(",");
    const eventsKey = events.join(",");

    // Keep onData ref updated to avoid stale closures
    useEffect(() => {
        onDataRef.current = onData;
    }, [onData]);

    useEffect(() => {
        // Connect to Socket.IO server at /socket path (same origin)
        const socket = io(serverUrl, { path: "/socket" });
        socketRef.current = socket;

        // Join all specified channels/rooms
        for (const channel of channels) {
            socket.emit("join-room", channel);
        }

        // Convert event names from "chat.message" to "chat:message" (Socket.IO format)
        const socketEvents = events.map((e) => e.replace(".", ":"));

        // Subscribe to each event
        for (const event of socketEvents) {
            socket.on(event, (data: unknown) => {
                onDataRef.current(event, data);
            });
        }

        // Cleanup on unmount
        return () => {
            for (const channel of channels) {
                socket.emit("leave-room", channel);
            }
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelsKey, eventsKey, serverUrl]);

    return socketRef;
}
