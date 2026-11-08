// external
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// internal
import * as notificationService from "../services/notificationService";
import type { NotificationSummary } from "../services/notificationService";

interface NotificationsContextValue extends NotificationSummary {
  // Re-reads the counts from the server.
  refresh: () => Promise<void>;
  // Opening Updates. Zeroes the sidebar number now and on the server. It never
  // marks anything as read: the number and "unread" are two separate things.
  markSeen: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

const POLL_MS = 30_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<NotificationSummary>({
    badge: 0,
    unread: 0,
    total: 0,
  });

  // Bumped whenever the person opens Updates. A poll that started before that
  // must not put the old number back when it finishes.
  const epoch = useRef(0);

  const refresh = useCallback(async () => {
    const started = epoch.current;
    try {
      const next = await notificationService.getNotificationSummary();
      if (started === epoch.current) setSummary(next);
    } catch {
      // A missed poll is fine. The next one catches up.
    }
  }, []);

  const markSeen = useCallback(() => {
    epoch.current += 1;
    const mine = epoch.current;

    setSummary((current) => ({ ...current, badge: 0 }));

    notificationService
      .markNotificationsSeen()
      .then((next) => {
        if (mine === epoch.current) setSummary(next);
      })
      .catch(() => {
        // The number stays cleared here. The next poll shows the server's truth.
      });
  }, []);

  useEffect(() => {
    // First read right after mount, then every 30 seconds.
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ ...summary, refresh, markSeen }),
    [summary, refresh, markSeen],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationsProvider",
    );
  }
  return context;
}
