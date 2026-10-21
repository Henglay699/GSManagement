import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import type { User } from "../types/user";

interface UserHubHandlers {
  onCreated?: () => void;
  onUpdated?: (user: User) => void;
  onDeleted?: (userId: number) => void;
}

// Subscribes to live user changes pushed by the backend's UserHub.
export function useUserHub(handlers: UserHubHandlers) {
  // Keep the latest handlers without reconnecting on every render.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/userhub")
      .withAutomaticReconnect()
      .build();

    connection.on("UserCreated", () => handlersRef.current.onCreated?.());
    connection.on("UserUpdated", (user: User) =>
      handlersRef.current.onUpdated?.(user),
    );
    connection.on("UserDeleted", (userId: number) =>
      handlersRef.current.onDeleted?.(userId),
    );

    connection.start().catch((err) => console.error("SignalR error:", err));

    return () => {
      connection.stop();
    };
  }, []);
}
