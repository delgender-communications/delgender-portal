const LABELS: Record<string, string> = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  Declined: "Declined",
  Draft: "Draft",
  Sent: "Sent",
  Paid: "Paid",
  Overdue: "Overdue",
  Cancelled: "Cancelled",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
