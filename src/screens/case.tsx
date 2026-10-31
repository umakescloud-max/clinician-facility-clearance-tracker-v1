import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AuditLog,
  DocumentViewer,
  StatusPill,
  Timeline,
  formatDate,
  formatDateTime,
  useActivity,
  type TimelineEntry,
} from "@kit";
import { Screen, PERSONA_NAME } from "./_shell";
import {
  EDGE_CASE_PACKET_ID,
  daysUntil,
  documentsForClinician,
  expirationLabel,
  notesForPacket,
  statusLabel,
  statusTone,
  usePackets,
} from "../seed";

export default function Case() {
  const [searchParams] = useSearchParams();
  const packets = usePackets();
  const requestedId = searchParams.get("case") ?? EDGE_CASE_PACKET_ID;
  const packet =
    packets.find((candidate) => candidate.id === requestedId) ??
    packets.find((candidate) => candidate.id === EDGE_CASE_PACKET_ID)!;

  const { logAction } = useActivity();
  const [draftNote, setDraftNote] = useState("");
  const [extraNotes, setExtraNotes] = useState<TimelineEntry[]>([]);

  const packetDocuments = documentsForClinician(packet.clinicianId);
  const timeline: TimelineEntry[] = [
    ...notesForPacket(packet.id).map((note) => ({
      id: note.id,
      timestamp: formatDateTime(note.timestamp),
      author: note.author,
      text: note.text,
    })),
    ...extraNotes,
  ];

  function handleAddNote() {
    const text = draftNote.trim();
    const entry: TimelineEntry = {
      id: `local-note-${Date.now()}`,
      timestamp: formatDateTime(new Date()),
      author: PERSONA_NAME,
      text: text || "Checked the packet. No new details were added.",
    };
    setExtraNotes((previous) => [...previous, entry]);
    setDraftNote("");
    logAction("Note added to packet #2318");
  }

  function handleRequestDocument() {
    const item = packet.blockedItem ?? "professional liability certificate";
    const readableItem = item.charAt(0).toLowerCase() + item.slice(1);
    const entry: TimelineEntry = {
      id: `local-request-${Date.now()}`,
      timestamp: formatDateTime(new Date()),
      author: PERSONA_NAME,
      text: `Requested a renewed ${readableItem} from ${packet.clinicianName}.`,
    };
    setExtraNotes((previous) => [...previous, entry]);
    logAction("Requested a renewed document from the clinician");
  }

  const firstShiftDays = daysUntil(packet.firstShiftDate);

  return (
    <Screen>
      <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-[var(--pf-muted)]">{packet.facilityName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Packet #{packet.id}
          </h1>
          <StatusPill label={statusLabel(packet.status)} tone={statusTone(packet.status)} />
        </div>
        <p className="mt-1 text-sm text-[var(--pf-muted)]">
          {packet.clinicianName}, {packet.clinicianId}. {packet.itemsAccepted} of {packet.itemsRequired}{" "}
          items accepted.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--pf-muted)]/20 p-4">
            <h2 className="text-lg font-medium">Packet facts</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--pf-muted)]">Opened</dt>
                <dd>{formatDate(packet.openedDate)}</dd>
              </div>
              <div>
                <dt className="text-[var(--pf-muted)]">First scheduled study</dt>
                <dd>
                  {formatDate(packet.firstShiftDate)}
                  {firstShiftDays >= 0 ? ` (in ${firstShiftDays} days)` : " (already started)"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--pf-muted)]">Returned by facility</dt>
                <dd>{packet.returnedDate ? formatDate(packet.returnedDate) : "Not returned"}</dd>
              </div>
              <div>
                <dt className="text-[var(--pf-muted)]">Item holding the packet</dt>
                <dd>{packet.blockedItem ?? packet.nextItem}</dd>
              </div>
            </dl>
            {packet.blockedReason && (
              <p className="mt-3 rounded-lg bg-[var(--pf-accent)] px-3 py-2 text-sm text-[var(--pf-ink)]">
                The facility flagged this packet: {packet.blockedReason}.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">Document checklist</h2>
            <p className="mt-1 text-sm text-[var(--pf-muted)]">
              Each item the facility requires, with its status and expiration date.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {packetDocuments.map((document) => (
                <DocumentViewer
                  key={document.id}
                  title={document.documentType}
                  lines={[
                    `Status: ${document.status}`,
                    `Expires ${expirationLabel(document.expirationDate)}`,
                  ]}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-medium">Packet timeline</h2>
            <p className="mt-1 text-sm text-[var(--pf-muted)]">
              Facility replies, follow-ups and notes, oldest first.
            </p>
            <div className="mt-3">
              <Timeline entries={timeline} dataTour="case-timeline" />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--pf-muted)]/20 p-4">
            <h2 className="text-lg font-medium">Add to the packet</h2>
            <label htmlFor="packet-note" className="mt-2 block text-sm text-[var(--pf-muted)]">
              Note
            </label>
            <textarea
              id="packet-note"
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              rows={3}
              placeholder="What did you find out?"
              className="mt-1 w-full rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] px-3 py-2 text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddNote}
                className="min-h-[44px] rounded-lg bg-[var(--pf-primary)] px-4 py-2 text-sm font-medium text-[var(--pf-surface)]"
              >
                Add note
              </button>
              <button
                type="button"
                onClick={handleRequestDocument}
                className="min-h-[44px] rounded-lg border border-[var(--pf-muted)]/30 px-4 py-2 text-sm"
              >
                Request document from clinician
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium">Actions on this packet</h2>
            <p className="mt-1 text-sm text-[var(--pf-muted)]">
              Everything you have done in this session.
            </p>
            <div className="mt-3">
              <AuditLog />
            </div>
          </section>
        </div>
      </div>
      </div>
    </Screen>
  );
}
