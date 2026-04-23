"use client";

import React, { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { SocketProvider } from "@/lib/socket";
import { NotificationProvider } from "@/lib/notification-provider";

/**
 * Wraps Socket and Notification providers behind an auth gate.
 * Guest users (landing page, auth page) won't trigger WebSocket connections
 * or notification API polling — saving significant network requests.
 */
export default function AuthenticatedProviders({ children }: { children: ReactNode }) {
  const { status } = useSession();

  // Only skip Socket + Notification providers when user is explicitly unauthenticated
  if (status === "unauthenticated") {
    // Guest — render children without socket/notification overhead
    return <>{children}</>;
  }

  // Loading or authenticated
  return (
    <SocketProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SocketProvider>
  );
}
