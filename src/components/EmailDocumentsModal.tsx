// external
import { useEffect, useState } from "react";
import { FiMail, FiX } from "react-icons/fi";

// internal
import * as clientsService from "../services/clientsService";
import type { Client } from "../services/clientsService";
import * as documentService from "../services/documentService";
import { formatFileSize } from "../services/documentService";
import type { DocumentsSent, TeamDocument } from "../services/documentService";

async function loadAllClients(): Promise<Client[]> {
  const all: Client[] = [];
  let page = 1;
  for (;;) {
    const res = await clientsService.getClients(page, 100);
    all.push(...res.data);
    if (page >= (res.totalPages || 1)) break;
    page += 1;
  }
  return all;
}

export default function EmailDocumentsModal({
  documents,
  preselectedIds,
  onClose,
  onSent,
}: {
  documents: TeamDocument[];
  preselectedIds: number[];
  onClose: () => void;
  onSent: (result: DocumentsSent) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientId, setClientId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>(preselectedIds);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadAllClients()
      .then((list) => {
        if (active) setClients(list);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Couldn't load the clients.",
        );
      })
      .finally(() => {
        if (active) setClientsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const chooseClient = async (value: string) => {
    setConfirming(false);
    setError(null);

    if (!value) {
      setClientId(null);
      setSubject("");
      setBody("");
      return;
    }

    const id = Number(value);
    setClientId(id);
    setTemplateLoading(true);
    try {
      const template = await documentService.getEmailTemplate(id);
      setSubject(template.subject);
      setBody(template.body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load the email text.",
      );
    } finally {
      setTemplateLoading(false);
    }
  };

  const toggle = (id: number) => {
    setConfirming(false);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const client = clients.find((item) => item.id === clientId) ?? null;
  const ready =
    client !== null &&
    selected.length > 0 &&
    subject.trim() !== "" &&
    body.trim() !== "" &&
    !templateLoading;

  const send = async () => {
    if (!client) return;
    setSending(true);
    setError(null);
    try {
      const result = await documentService.sendDocumentsEmail({
        clientId: client.id,
        documentIds: selected,
        subject: subject.trim(),
        body: body.trim(),
      });
      onSent(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send those documents.",
      );
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={sending ? undefined : onClose}>
      <div
        className="modal-panel modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>Email documents</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              Pick the client and tick the documents to send. The message is
              pre-written, so just edit it if you want to.
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
            disabled={sending}
          >
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label>Client</label>
          <select
            value={clientId ?? ""}
            onChange={(e) => void chooseClient(e.target.value)}
            disabled={clientsLoading || sending}
          >
            <option value="">
              {clientsLoading ? "Loading clients…" : "Choose a client"}
            </option>
            {clients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.companyName} · {item.contactFullName}
              </option>
            ))}
          </select>
          <div className="field-hint">
            {client
              ? `It will be sent to ${client.email}. Choosing a different client rewrites the message below.`
              : "The documents are sent to the email address saved for this client."}
          </div>
        </div>

        <div className="field">
          <label>Documents to send</label>
          {documents.length === 0 ? (
            <p className="text-muted text-small">
              There are no documents yet. Add one first.
            </p>
          ) : (
            <ul className="doc-pick-list">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={selected.includes(doc.id)}
                      onChange={() => toggle(doc.id)}
                      disabled={sending}
                    />
                    <span className="doc-pick-text">
                      <span className="doc-pick-title">{doc.title}</span>
                      <span className="text-muted text-small">
                        {doc.fileName} · {formatFileSize(doc.sizeBytes)}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="field">
          <label>Subject</label>
          <input
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setConfirming(false);
            }}
            placeholder={
              client ? "Subject" : "Choose a client to load the subject"
            }
            maxLength={200}
            disabled={!client || templateLoading || sending}
          />
        </div>

        <div className="field">
          <label>Message</label>
          <textarea
            rows={12}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setConfirming(false);
            }}
            placeholder={
              client ? "Message" : "Choose a client to load the message"
            }
            maxLength={8000}
            disabled={!client || templateLoading || sending}
          />
          <div className="field-hint">
            A blank line starts a new paragraph. The documents are attached
            automatically.
          </div>
        </div>

        {confirming && client ? (
          <div className="response-block" style={{ marginTop: 8 }}>
            <p className="text-small" style={{ marginBottom: 12 }}>
              This will email {selected.length}{" "}
              {selected.length === 1 ? "document" : "documents"} to{" "}
              {client.email} and can't be undone. Send it?
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={send}
                disabled={sending}
              >
                {sending ? "Sending…" : "Yes, send it"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!ready}
            >
              <FiMail size={14} /> Send documents
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
