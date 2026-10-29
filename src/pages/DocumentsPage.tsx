// external
import { useEffect, useState } from "react";
import { FiDownload, FiMail, FiPlus, FiTrash2 } from "react-icons/fi";

// internal
import { useAuth } from "../context/AuthContext";
import * as documentService from "../services/documentService";
import { formatFileSize } from "../services/documentService";
import type { TeamDocument } from "../services/documentService";
import { formatDate } from "../utils/format";
import DocumentFormModal from "../components/DocumentFormModal";
import EmailDocumentsModal from "../components/EmailDocumentsModal";
import "./ListPage.css";
import "./DocumentsPage.css";

export default function DocumentsPage() {
  const { staff, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [emailing, setEmailing] = useState<number[] | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<TeamDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () => {
    documentService
      .getDocuments()
      .then((list) => {
        setDocuments(list);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Couldn't load the documents.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async (doc: TeamDocument) => {
    setDownloadingId(doc.id);
    setError(null);
    try {
      await documentService.downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't download that document.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await documentService.deleteDocument(deleting.id);
      setDeleting(null);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't delete that document.",
      );
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const canDelete = (doc: TeamDocument) =>
    isAdmin || doc.uploadedByStaffId === staff?.id;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p className="text-muted">
            Essential documents for the whole team, like the contract. Anyone
            can add one, download it, or email it to a client.
          </p>
        </div>
        <div className="doc-header-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setNotice(null);
              setEmailing([]);
            }}
            disabled={documents.length === 0}
          >
            <FiMail size={16} /> Email documents
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setAdding(true)}
          >
            <FiPlus size={16} /> Add document
          </button>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}
      {notice && <div className="form-notice-banner">{notice}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Added by</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="empty-row">
                    Loading…
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">
                    No documents yet. Add the contract to get started.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{doc.title}</div>
                      <div className="doc-file text-muted text-small">
                        {doc.fileName} · {formatFileSize(doc.sizeBytes)}
                      </div>
                      {doc.description && (
                        <div className="text-small" style={{ marginTop: 4 }}>
                          {doc.description}
                        </div>
                      )}
                    </td>
                    <td className="text-muted" data-label="Added by">
                      {doc.uploadedByName}
                    </td>
                    <td className="text-muted" data-label="Added">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td>
                      <div className="doc-row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                        >
                          <FiDownload size={14} />{" "}
                          {downloadingId === doc.id
                            ? "Downloading…"
                            : "Download"}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            setEmailing([doc.id]);
                          }}
                        >
                          <FiMail size={14} /> Email
                        </button>
                        {canDelete(doc) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            type="button"
                            aria-label={`Delete ${doc.title}`}
                            onClick={() => setDeleting(doc)}
                          >
                            <FiTrash2 size={14} />
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
      </div>

      {adding && (
        <DocumentFormModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      {emailing && (
        <EmailDocumentsModal
          documents={documents}
          preselectedIds={emailing}
          onClose={() => setEmailing(null)}
          onSent={(result) => {
            setEmailing(null);
            setNotice(
              `Sent ${result.documentCount} ${
                result.documentCount === 1 ? "document" : "documents"
              } to ${result.recipientEmail}.`,
            );
          }}
        />
      )}

      {deleting && (
        <div
          className="modal-backdrop"
          onClick={deleteBusy ? undefined : () => setDeleting(null)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 19, marginBottom: 10 }}>Delete document?</h2>
            <p className="text-muted" style={{ marginBottom: 20 }}>
              "{deleting.title}" will be removed for the whole team. This can't
              be undone.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting…" : "Yes, delete it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
