// external
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiTarget,
  FiUserCheck,
  FiBell,
} from "react-icons/fi";

// internal
import { useNotifications } from "../context/NotificationsContext";
import * as notificationService from "../services/notificationService";
import {
  NotificationType,
  type AppNotification,
} from "../services/notificationService";
import { formatRelative } from "../utils/format";
import { Skeleton, SkeletonLabel } from "../components/Skeleton";
import "./DashboardPage.css";
import "./UpdatesPage.css";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

function typeIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.NewLead:
      return <FiTarget size={18} />;
    case NotificationType.NewBooking:
      return <FiCalendar size={18} />;
    case NotificationType.InvoiceOverdue:
      return <FiAlertCircle size={18} />;
    case NotificationType.ChangeRequest:
      return <FiUserCheck size={18} />;
    default:
      return <FiCheckCircle size={18} />;
  }
}

function typeTone(type: NotificationType): string {
  if (type === NotificationType.InvoiceOverdue) return "danger";
  if (type === NotificationType.NewBooking) return "accent";
  if (type === NotificationType.NewLead) return "success";
  return "warning";
}

export default function UpdatesPage() {
  const navigate = useNavigate();
  const { badge, unread, total, markSeen, refresh } = useNotifications();

  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Being on this page counts as seeing the updates. That clears the sidebar number,
  // including when one arrives while you're looking at the page. It never marks
  // anything as read.
  useEffect(() => {
    if (badge > 0) markSeen();
  }, [badge, markSeen]);

  // Reloads when the filter changes, and when something new arrives (the total changes).
  useEffect(() => {
    let cancelled = false;
    notificationService
      .getNotifications(1, PAGE_SIZE, filter === "unread")
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setTotalCount(res.totalCount);
        setPage(1);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your updates.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, total]);

  const switchFilter = (next: Filter) => {
    if (next === filter) return;
    setFilter(next);
    setItems([]);
    setLoading(true);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await notificationService.getNotifications(
        page + 1,
        PAGE_SIZE,
        filter === "unread",
      );
      setItems((prev) => [...prev, ...res.data]);
      setTotalCount(res.totalCount);
      setPage(page + 1);
    } catch {
      setError("Couldn't load more updates.");
    } finally {
      setLoadingMore(false);
    }
  };

  const setRead = async (item: AppNotification, read: boolean) => {
    // Update the list straight away. It's put back if the server says no.
    const before = items;
    setItems((prev) =>
      filter === "unread" && read
        ? prev.filter((n) => n.id !== item.id)
        : prev.map((n) => (n.id === item.id ? { ...n, isRead: read } : n)),
    );

    try {
      if (read) await notificationService.markNotificationRead(item.id);
      else await notificationService.markNotificationUnread(item.id);
      void refresh();
    } catch {
      setItems(before);
      setError("Couldn't update that notification.");
    }
  };

  const open = async (item: AppNotification) => {
    if (!item.isRead) void setRead(item, true);
    if (item.linkUrl) navigate(item.linkUrl);
  };

  const markAll = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setItems((prev) =>
        filter === "unread" ? [] : prev.map((n) => ({ ...n, isRead: true })),
      );
      void refresh();
    } catch {
      setError("Couldn't mark everything as read.");
    }
  };

  return (
    <div className="updates-page">
      <div className="page-header">
        <div>
          <h1>Updates</h1>
          <p className="text-muted">
            New leads, bookings and overdue invoices. Choose which ones show in
            Settings.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={markAll}
          disabled={unread === 0}
        >
          <FiCheck size={15} /> Mark all as read
        </button>
      </div>

      <div className="updates-tabs" role="tablist">
        {(
          [
            ["all", "All"],
            ["unread", "Unread"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={`updates-tab${filter === value ? " active" : ""}`}
            onClick={() => switchFilter(value)}
          >
            {label}
            {value === "unread" && unread > 0 && (
              <span className="updates-tab-count">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      {loading ? (
        <div className="updates-list">
          <SkeletonLabel text="Loading updates" />
          {[0, 1, 2].map((i) => (
            <div className="update-item" key={i}>
              <Skeleton width={40} height={40} radius={12} />
              <div className="update-main">
                <div className="skeleton-stack">
                  <Skeleton width="45%" height={14} />
                  <Skeleton width="70%" height={11} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="updates-empty">
          <FiBell size={26} />
          <div className="updates-empty-title">
            {filter === "unread" ? "You're all caught up" : "Nothing yet"}
          </div>
          <p className="text-muted text-small">
            {filter === "unread"
              ? "There's nothing unread."
              : "New leads, bookings and overdue invoices will show up here."}
          </p>
        </div>
      ) : (
        <>
          <div className="updates-list">
            {items.map((item) => (
              <div
                key={item.id}
                className={`update-item${item.isRead ? "" : " unread"}${item.linkUrl ? " clickable" : ""}`}
                onClick={() => void open(item)}
              >
                <div className={`update-icon tone-${typeTone(item.type)}`}>
                  {typeIcon(item.type)}
                </div>

                <div className="update-main">
                  <div className="update-title">
                    {!item.isRead && <span className="update-dot" />}
                    {item.title}
                  </div>
                  {item.body && (
                    <div className="update-body text-muted">{item.body}</div>
                  )}
                  <div className="update-time text-small">
                    {formatRelative(item.createdAt)}
                  </div>
                </div>

                <button
                  className="btn btn-ghost btn-sm update-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    void setRead(item, !item.isRead);
                  }}
                >
                  {item.isRead ? "Mark unread" : "Mark read"}
                </button>
              </div>
            ))}
          </div>

          {items.length < totalCount && (
            <div className="updates-more">
              <button
                className="btn btn-ghost"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
