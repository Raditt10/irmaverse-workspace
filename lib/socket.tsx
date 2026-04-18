"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface PresenceData {
  userId: string;
  status: "online" | "offline" | "away";
  name: string;
}

interface TypingData {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface MessageData {
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageId: string;
  senderName: string;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Map<string, PresenceData>;
  typingUsers: Map<string, { userId: string; userName: string }[]>;
  lastSeenMap: Map<string, string>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (data: Omit<MessageData, "messageId" | "createdAt">) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string, messageIds: string[]) => void;
  updateLastSeen: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceData>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string; userName: string }[]>>(new Map());
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!session?.user?.id) return;

    const socketInstance = io({
      transports: ['websocket', 'polling'],
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);

      // Send user info on connect
      socketInstance.emit("user:join", {
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name || "Anonymous",
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Handle presence updates
    socketInstance.on("presence:update", (data: PresenceData) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        if (data.status === "offline") {
          newMap.delete(data.userId);
        } else {
          newMap.set(data.userId, data);
        }
        return newMap;
      });
    });

    // Handle initial presence list
    socketInstance.on("presence:list", (users: PresenceData[]) => {
      const usersMap = new Map<string, PresenceData>();
      users.forEach((user) => {
        usersMap.set(user.userId, user);
      });
      setOnlineUsers(usersMap);
    });

    // Handle typing updates
    socketInstance.on("typing:update", (data: TypingData) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const conversationTypers = newMap.get(data.conversationId) || [];
        
        if (data.isTyping) {
          if (!conversationTypers.find(t => t.userId === data.userId)) {
            newMap.set(data.conversationId, [
              ...conversationTypers,
              { userId: data.userId, userName: data.userName }
            ]);
          }
        } else {
          newMap.set(
            data.conversationId,
            conversationTypers.filter(t => t.userId !== data.userId)
          );
        }
        return newMap;
      });
    });

    // Handle last seen updates
    socketInstance.on("user:last-seen-updated", (data: { userId: string; lastSeen: string }) => {
      setLastSeenMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data.lastSeen);
        return newMap;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.user?.id, session?.user?.role, session?.user?.name]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit("conversation:join", conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit("conversation:leave", conversationId);
    }
  }, [socket]);

  const sendMessage = useCallback((data: Omit<MessageData, "messageId" | "createdAt">) => {
    if (socket && session?.user) {
      socket.emit("message:send", {
        ...data,
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        senderName: session.user.name || "Anonymous",
      });
    }
  }, [socket, session?.user]);

  const startTyping = useCallback((conversationId: string) => {
    if (socket && session?.user) {
      socket.emit("typing:start", {
        conversationId,
        userId: session.user.id,
        userName: session.user.name || "Anonymous",
      });
    }
  }, [socket, session?.user]);

  const stopTyping = useCallback((conversationId: string) => {
    if (socket && session?.user) {
      socket.emit("typing:stop", {
        conversationId,
        userId: session.user.id,
      });
    }
  }, [socket, session?.user]);

  const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
    if (socket && session?.user) {
      socket.emit("message:read", {
        conversationId,
        userId: session.user.id,
        messageIds,
      });
    }
  }, [socket, session?.user]);

  const updateLastSeen = useCallback(() => {
    if (socket && session?.user) {
      socket.emit("user:update-last-seen", session.user.id);
    }
  }, [socket, session?.user]);

  // Update last seen every 5 minutes (only when tab is visible)
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const interval = setInterval(() => {
      // Only send if tab is active to avoid wasting requests on background tabs
      if (document.visibilityState === 'visible') {
        updateLastSeen();
        fetch('/api/users/last-seen', { method: 'POST' }).catch(console.error);
      }
    }, 300000); // Every 5 minutes (was 60s)

    return () => clearInterval(interval);
  }, [session?.user?.id, updateLastSeen]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        lastSeenMap,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        updateLastSeen,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
