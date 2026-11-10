// external
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiSend } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES, OutreachStatus } from "../services/outreachService";
import type {
  OutreachDetail,
  OutreachInput,
} from "../services/outreachService";
import { formatDate } from "../utils/format";
import { mergeDetail, timeAgo, toInput } from "../utils/outreachHelpers";
import InfoTip from "../components/InfoTip";
import { Skeleton } from "../components/Skeleton";
import ActivityCard from "../components/outreach/ActivityCard";
import ContactCard from "../components/outreach/ContactCard";
import FilesCard from "../components/outreach/FilesCard";
import type { FileKey } from "../components/outreach/FilesCard";
import NextStepCard from "../components/outreach/NextStepCard";
import NotesCard from "../components/outreach/NotesCard";
import OutreachBodySkeleton from "../components/outreach/OutreachBodySkeleton";
import PipelineStepper from "../components/outreach/PipelineStepper";
import ReadinessCard from "../components/outreach/ReadinessCard";
import ResearchCard from "../components/outreach/ResearchCard";
import StatusPicker from "../components/outreach/StatusPicker";
import "./ListPage.css";
import "./OutreachPage.css";
import "./OutreachCompanyPage.css";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const REPORT_EXTENSIONS = [".docx", ".txt", ".pdf"];

type NavState = {
  from?: string;
  company?: OutreachDetail;
  preview?: { companyName: string; status: OutreachStatus };
  notice?: string;
} | null;

type Draft = {
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  status: OutreachStatus;
};

function draftFrom(company: OutreachDetail | null): Draft {
  return {
    companyName: company?.companyName ?? "",
    contactName: company?.contactName ?? "",
    email: company?.email ?? "",
    phoneNumber: company?.phoneNumber ?? "",
    status: company?.status ?? OutreachStatus.Researching,
  };
}

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function OutreachCompanyPage({
  creating = false,
}: {
  creating?: boolean;
}) {
  const { id: idParam, "*": splat } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const nav = (location.state ?? null) as NavState;

  const id = creating ? null : Number(idParam);
  const invalid = !creating && !Number.isInteger(id);
  const editing = creating || splat === "edit";
  const backTo = nav?.from ?? "/outreach";
  const routeState = { from: backTo };

  const seed = nav?.company && nav.company.id === id ? nav.company : null;

  const [company, setCompany] = useState<OutreachDetail | null>(seed);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState(seed?.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [overrides, setOverrides] = useState<Partial<Draft>>({});
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  const [reportKey, setReportKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<FileKey | null>(null);
  const [acting, setActing] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(nav?.notice ?? null);
  const [pendingLeave, setPendingLeave] = useState<{
    to: string;
    state?: unknown;
  } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (id == null || invalid) return;
    let active = true;
    const seededNotes = seed?.notes ?? "";
    outreachService
      .getOutreachById(id)
      .then((detail) => {
        if (!active) return;
        setCompany(detail);
        setNotes((current) =>
          current === seededNotes ? (detail.notes ?? "") : current,
        );
      })
      .catch((err: unknown) => {
        if (active && !seed) {
          setLoadError(messageOf(err, "Couldn't open that company."));
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // ---------- form ----------

  const base = useMemo(() => draftFrom(company), [company]);
  const form: Draft = { ...base, ...overrides };
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setOverrides((current) => ({ ...current, [key]: value }));

  const fieldsDirty = (Object.keys(overrides) as (keyof Draft)[]).some(
    (key) => overrides[key] !== base[key],
  );
  const notesDirty = notes !== (company?.notes ?? "");
  const filesSelected = Boolean(deckFile || reportFile);
  const unsaved = fieldsDirty || filesSelected || notesDirty;

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const fail = (message: string) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetDraft = () => {
    setOverrides({});
    setDeckFile(null);
    setReportFile(null);
    setDeckKey((key) => key + 1);
    setReportKey((key) => key + 1);
  };

  const leave = (to: string, state?: unknown) => {
    if (unsaved) {
      setPendingLeave({ to, state });
    } else {
      navigate(to, { state });
    }
  };

  const discardAndLeave = () => {
    if (!pendingLeave) return;
    const { to, state } = pendingLeave;
    resetDraft();
    setNotes(company?.notes ?? "");
    setPendingLeave(null);
    navigate(to, { state: state ?? routeState });
  };

  const selectDeck = (file: File | null) => {
    setDeckFile(file);
    if (!file) setDeckKey((key) => key + 1);
  };

  const selectReport = (file: File | null) => {
    setReportFile(file);
    if (!file) setReportKey((key) => key + 1);
  };

  // ---------- actions ----------

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      fail("Company name is required.");
      return;
    }
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      fail("That email doesn't look right.");
      return;
    }
    if (deckFile) {
      const looksLikePdf =
        deckFile.type === "application/pdf" ||
        deckFile.name.toLowerCase().endsWith(".pdf");
      if (!looksLikePdf) return fail("The pitch deck needs to be a PDF.");
      if (deckFile.size > MAX_FILE_BYTES)
        return fail("That PDF is over 20 MB.");
    }
    if (reportFile) {
      const lower = reportFile.name.toLowerCase();
      if (!REPORT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        return fail("The report needs to be a DOCX, TXT or PDF file.");
      }
      if (reportFile.size > MAX_FILE_BYTES) {
        return fail("That report is over 20 MB.");
      }
    }

    setSaving(true);
    setError(null);

    const payload: OutreachInput = {
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim() || null,
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      notes: notes.trim() || null,
      status: form.status,
    };

    try {
      let latest = company
        ? mergeDetail(
            company,
            await outreachService.updateOutreach(company.id, payload),
          )
        : await outreachService.createOutreach(payload);

      const uploadErrors: string[] = [];

      if (deckFile) {
        try {
          latest = mergeDetail(
            latest,
            await outreachService.uploadPitchDeck(latest.id, deckFile),
          );
          setDeckFile(null);
          setDeckKey((key) => key + 1);
        } catch (err) {
          uploadErrors.push(messageOf(err, "The pitch deck didn't upload."));
        }
      }

      if (reportFile) {
        try {
          latest = mergeDetail(
            latest,
            await outreachService.uploadReport(latest.id, reportFile),
          );
          setReportFile(null);
          setReportKey((key) => key + 1);
        } catch (err) {
          uploadErrors.push(messageOf(err, "The report didn't upload."));
        }
      }

      if (uploadErrors.length > 0) {
        const message = `${uploadErrors.join(" ")} The company itself was saved.`;
        if (!company) {
          navigate(`/outreach/${latest.id}/edit`, {
            replace: true,
            state: { from: backTo, company: latest },
          });
        }
        setCompany(latest);
        setNotes(latest.notes ?? "");
        setOverrides({});
        fail(message);
        return;
      }

      setCompany(latest);
      setNotes(latest.notes ?? "");
      resetDraft();
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (creating) {
        navigate(`/outreach/${latest.id}`, {
          replace: true,
          state: { from: backTo, company: latest, notice: "Company added." },
        });
      } else {
        setNotice("Changes saved.");
        navigate(`/outreach/${latest.id}`, {
          replace: true,
          state: routeState,
        });
      }
    } catch (err) {
      fail(messageOf(err, "Couldn't save that company."));
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!company) return;
    setSavingNotes(true);
    setNotesSaved(false);
    setError(null);
    try {
      const updated = await outreachService.updateOutreachNotes(
        company.id,
        notes,
      );
      setCompany((current) => mergeDetail(current, updated));
      setNotes(updated.notes ?? "");
      setNotesSaved(true);
    } catch (err) {
      fail(messageOf(err, "Couldn't save those notes."));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownload = async (which: FileKey) => {
    if (!company) return;
    setDownloading(which);
    setError(null);
    try {
      if (which === "deck") {
        await outreachService.downloadPitchDeck(
          company.id,
          company.pitchDeckFileName,
        );
      } else {
        await outreachService.downloadReport(
          company.id,
          company.reportFileName,
        );
      }
    } catch (err) {
      fail(messageOf(err, "Couldn't download that file."));
    } finally {
      setDownloading(null);
    }
  };

  const runEmailAction = async (kind: "send" | "manual") => {
    if (!company) return;
    setActing(true);
    setError(null);
    try {
      const updated =
        kind === "send"
          ? await outreachService.sendOutreachEmail(company.id)
          : await outreachService.markOutreachEmailed(company.id);
      setCompany((current) => mergeDetail(current, updated));
      setNotice(kind === "send" ? "Email sent." : "Marked as emailed.");
    } catch (err) {
      fail(messageOf(err, "Something went wrong."));
    } finally {
      setActing(false);
    }
  };

  const markReady = async () => {
    if (!company) return;
    setMarkingReady(true);
    setError(null);
    try {
      const updated = await outreachService.updateOutreach(
        company.id,
        toInput(company, { status: OutreachStatus.Ready }),
      );
      setCompany((current) => mergeDetail(current, updated));
      setNotice("Marked as Ready.");
    } catch (err) {
      fail(messageOf(err, "Couldn't update that company."));
    } finally {
      setMarkingReady(false);
    }
  };

  // ---------- derived ----------

  const title = creating
    ? "Add company"
    : (company?.companyName ?? nav?.preview?.companyName);
  const headerStatus = company?.status ?? nav?.preview?.status;
  const statusMeta = OUTREACH_STATUSES.find(
    (item) => item.value === headerStatus,
  );

  const hasDeck = Boolean(company?.pitchDeckUrl) || Boolean(deckFile);
  const hasReport = Boolean(company?.reportUrl) || Boolean(reportFile);
  const effectiveStatus = editing
    ? form.status
    : (company?.status ?? form.status);
  const showReadiness =
    editing ||
    effectiveStatus === OutreachStatus.Researching ||
    effectiveStatus === OutreachStatus.Ready;

  const canSendFromSystem = Boolean(company?.email && company?.pitchDeckUrl);
  const cancelTo = creating ? backTo : `/outreach/${id}`;
  const editHref = `/outreach/${id}/edit`;

  const canSave = creating ? form.companyName.trim() !== "" : unsaved;

  const primaryLabel = saving
    ? "Saving…"
    : creating
      ? "Add company"
      : "Save changes";

  const scrollToReachOut = () =>
    document
      .getElementById("oc-next")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ---------- render ----------

  let body;
  if (invalid || loadError) {
    body = (
      <section className="card oc-card oc-empty">
        <h2 className="oc-card-title">Company not found</h2>
        <p className="text-muted text-small">
          {loadError ?? "That company doesn't exist."}
        </p>
        <Link className="btn btn-ghost" to={backTo}>
          <FiArrowLeft size={15} /> Back to outreach
        </Link>
      </section>
    );
  } else if (!creating && !company) {
    body = <OutreachBodySkeleton />;
  } else {
    body = (
      <>
        <PipelineStepper status={effectiveStatus} />

        <div className="oc-grid">
          <div className="oc-col">
            {editing ? (
              <StatusPicker
                value={form.status}
                onChange={(status) => setField("status", status)}
              />
            ) : (
              company && (
                <NextStepCard
                  key={company.status}
                  company={company}
                  editHref={editHref}
                  editState={routeState}
                  canSendFromSystem={canSendFromSystem}
                  acting={acting}
                  onRunEmail={runEmailAction}
                  markingReady={markingReady}
                  onMarkReady={markReady}
                />
              )
            )}

            <ContactCard
              editing={editing}
              values={
                editing
                  ? form
                  : {
                      companyName: company?.companyName ?? "",
                      contactName: company?.contactName ?? "",
                      email: company?.email ?? "",
                      phoneNumber: company?.phoneNumber ?? "",
                    }
              }
              onChange={(key, value) => setField(key, value)}
            />

            {company?.research && <ResearchCard research={company.research} />}

            <NotesCard
              notes={notes}
              onChange={(value) => {
                setNotes(value);
                setNotesSaved(false);
              }}
              dirty={notesDirty}
              saving={savingNotes}
              saved={notesSaved}
              onSave={saveNotes}
              saveWithForm={editing}
            />
          </div>

          <div className="oc-col">
            {showReadiness && (
              <ReadinessCard
                input={{
                  hasEmail: Boolean(
                    editing ? form.email.trim() : company?.email,
                  ),
                  hasDeck,
                  hasReport,
                  isReady:
                    effectiveStatus === OutreachStatus.Ready ||
                    effectiveStatus === OutreachStatus.Emailed,
                }}
              />
            )}

            <FilesCard
              editing={editing}
              company={company}
              deckFile={deckFile}
              reportFile={reportFile}
              deckKey={deckKey}
              reportKey={reportKey}
              onDeckSelected={selectDeck}
              onReportSelected={selectReport}
              onDownload={handleDownload}
              downloading={downloading}
            />

            <ActivityCard
              logs={company?.logs ?? []}
              emptyText={
                creating
                  ? "Activity starts once the company is added."
                  : "No activity yet."
              }
            />
          </div>
        </div>
      </>
    );
  }

  const ready = Boolean(company) || creating;

  return (
    <div className="oc-page">
      <Link
        className="oc-back"
        to={backTo}
        onClick={(event) => {
          if (unsaved) {
            event.preventDefault();
            setPendingLeave({ to: backTo });
          }
        }}
      >
        <FiArrowLeft size={16} /> Outreach
      </Link>

      <header className="oc-header">
        <div className="oc-title-row">
          <div className="oc-title-block">
            {title ? (
              <h1 className="oc-title">
                {title}
                {editing && !creating && (
                  <span className="oc-edit-tag">Editing</span>
                )}
              </h1>
            ) : (
              <Skeleton width={240} height={30} />
            )}

            {!creating && (
              <div className="info-tip-anchor oc-status-row">
                {statusMeta ? (
                  <>
                    <span className={`badge ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                    <InfoTip
                      label="What each status means"
                      title="What each status means"
                    >
                      <ul className="status-tip-list">
                        {OUTREACH_STATUSES.map((status) => (
                          <li
                            key={status.value}
                            className={
                              status.value === headerStatus
                                ? "current"
                                : undefined
                            }
                          >
                            <span className={`badge ${status.badge}`}>
                              {status.label}
                            </span>
                            <span>{status.description}</span>
                          </li>
                        ))}
                      </ul>
                    </InfoTip>
                  </>
                ) : (
                  <Skeleton width={90} height={24} radius={999} />
                )}
              </div>
            )}

            <p className="oc-meta">
              {creating ? (
                "Record a company we want to work with. You can set any status now."
              ) : editing ? (
                "Anything here can be changed at any time."
              ) : company ? (
                <>
                  <span>Added by {company.addedByName}</span>
                  <span>{formatDate(company.createdAt)}</span>
                  <span>Updated {timeAgo(company.updatedAt)}</span>
                </>
              ) : (
                <Skeleton width={260} height={13} />
              )}
            </p>
          </div>

          {ready && (
            <div className="oc-actions">
              {editing ? (
                <>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => leave(cancelTo, routeState)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !canSave}
                  >
                    {primaryLabel}
                  </button>
                </>
              ) : (
                <Link
                  className="btn btn-ghost"
                  to={editHref}
                  state={routeState}
                >
                  <FiEdit2 size={15} /> Edit
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {notice && (
        <div className="oc-notice" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="form-error-banner" role="alert">
          {error}
        </div>
      )}

      {pendingLeave && (
        <div
          className="oc-discard"
          role="alertdialog"
          aria-label="Unsaved changes"
        >
          <p className="text-small">
            You have unsaved changes. If you leave now, they'll be lost.
          </p>
          <div className="oc-btn-row" style={{ marginTop: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => setPendingLeave(null)}
            >
              Keep editing
            </button>
            <button
              className="btn btn-danger btn-sm"
              type="button"
              onClick={discardAndLeave}
            >
              Discard changes
            </button>
          </div>
        </div>
      )}

      {body}

      {ready && (
        <div className="oc-mobilebar">
          {editing ? (
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => leave(cancelTo, routeState)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleSave}
                disabled={saving || !canSave}
              >
                {primaryLabel}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to={editHref} state={routeState}>
                <FiEdit2 size={16} /> Edit
              </Link>
              {company?.status === OutreachStatus.Ready && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={scrollToReachOut}
                >
                  <FiSend size={16} /> Reach out
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
