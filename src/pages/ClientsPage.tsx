// external
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

// internal
import * as clientService from "../services/clientsService";
import { ClientStatus } from "../services/clientsService";
import type { Client } from "../services/clientsService";
import AddClientModal from "../components/AddClientModal";
import ChangeClientStatusModal from "../components/ChangeClientStatusModal";
import { formatDuration } from "../utils/format";
import "./ListPage.css";

const TABS: { label: string; value?: ClientStatus }[] = [
  { label: "All" },
  { label: "Working with", value: ClientStatus.Working },
  { label: "Pending", value: ClientStatus.Pending },
  { label: "Not working with", value: ClientStatus.Declined },
];

const STATUS_BADGE: Record<ClientStatus, string> = {
  Working: "badge-confirmed",
  Pending: "badge-pending",
  Declined: "badge-declined",
};

const STATUS_LABEL: Record<ClientStatus, string> = {
  Working: "Current",
  Pending: "Pending",
  Declined: "Not working with",
};

export default function ClientsPage() {
  const [tab, setTab] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [statusChange, setStatusChange] = useState<{
    client: Client;
    nextStatus: ClientStatus;
  } | null>(null);

  const load = () => {
    setLoading(true);
    clientService
      .getClients(page, 15, TABS[tab].value)
      .then((res) => {
        setClients(res.data);
        setTotalPages(res.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const relationshipLabel = (client: Client): string => {
    if (client.status === ClientStatus.Working && client.workingSince) {
      return `${formatDuration(client.workingSince)} so far`;
    }
    if (client.workingSince && client.workingUntil) {
      return `Worked together ${formatDuration(client.workingSince, client.workingUntil)}`;
    }
    return "—";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clients</h1>
          <p className="text-muted">
            Everyone who's booked with us, and who we're working with now.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <FiPlus size={16} /> Add client
        </button>
      </div>

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button
            key={t.label}
            className={`pill-tab ${tab === i ? "active" : ""}`}
            onClick={() => {
              setTab(i);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Industry</th>
                <th>Relationship</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Loading…
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No clients here yet.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {client.companyName}
                      </div>
                      <div className="text-muted text-small">
                        {client.email}
                      </div>
                    </td>
                    <td>
                      <div>{client.contactFullName}</div>
                      {client.contactJobTitle && (
                        <div className="text-muted text-small">
                          {client.contactJobTitle}
                        </div>
                      )}
                    </td>
                    <td className="text-muted">{client.industry}</td>
                    <td className="text-small">{relationshipLabel(client)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[client.status]}`}>
                        {STATUS_LABEL[client.status]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {client.status !== ClientStatus.Working && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() =>
                              setStatusChange({
                                client,
                                nextStatus: ClientStatus.Working,
                              })
                            }
                          >
                            {client.status === ClientStatus.Pending
                              ? "Accept"
                              : "Work again"}
                          </button>
                        )}
                        {client.status !== ClientStatus.Declined && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              setStatusChange({
                                client,
                                nextStatus: ClientStatus.Declined,
                              })
                            }
                          >
                            {client.status === ClientStatus.Pending
                              ? "Decline"
                              : "End"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-muted text-small">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {statusChange && (
        <ChangeClientStatusModal
          client={statusChange.client}
          nextStatus={statusChange.nextStatus}
          onClose={() => setStatusChange(null)}
          onDone={() => {
            setStatusChange(null);
            load();
          }}
        />
      )}
    </div>
  );
}
