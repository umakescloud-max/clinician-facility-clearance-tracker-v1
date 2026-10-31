import {
  ApprovalQueue,
  AuditLog,
  DocumentViewer,
  formatDate,
  formatDateTime,
  useActivity,
  type ApprovalItem,
} from "@kit";
import { Screen, PERSONA_NAME } from "./_shell";
import {
  EDGE_CASE_PACKET_ID,
  REQUIRED_ITEMS,
  addPacketNote,
  daysUntil,
  documents,
  expirationLabel,
  formatDateWithYear,
  liabilityRequirementDate,
  returnPacketForDocuments,
  sendPacketToFacility,
  usePackets,
} from "../seed";

export default function Appeals() {
  const { logAction } = useActivity();
  const allPackets = usePackets();

  const packet = allPackets.find((candidate) => candidate.id === EDGE_CASE_PACKET_ID);
  const renewalCertificate = documents.find(
    (document) =>
      document.clinicianId === "C-11" &&
      document.documentType === "Professional liability certificate (renewal)"
  );

  const returnedDays = packet?.returnedDate ? Math.abs(daysUntil(packet.returnedDate)) : 0;
  const queueStage = packet?.queueStage ?? "none";
  const isSent = queueStage === "sent";
  const isReturned = queueStage === "returned";

  const queueOpen = !isReturned;

  const subtitle = isSent
    ? "Sent to Cedar Hollow, awaiting facility."
    : packet?.certificateAttached
      ? `Returned ${returnedDays} ${returnedDays === 1 ? "day" : "days"} ago. Renewed certificate attached and waiting for your check.`
      : `Returned ${returnedDays} ${returnedDays === 1 ? "day" : "days"} ago. The renewed certificate still needs attaching on Blocked clearances.`;

  const items: ApprovalItem[] = queueOpen
    ? [
        {
          id: EDGE_CASE_PACKET_ID,
          title: packet
            ? `Packet #${packet.id} for ${packet.clinicianName} at ${packet.facilityName}`
            : `Packet #${EDGE_CASE_PACKET_ID}`,
          subtitle,
          edgeCase: true,
        },
      ]
    : [];

  function handlePrimary() {
    if (!packet || isSent || isReturned) return;
    sendPacketToFacility(EDGE_CASE_PACKET_ID);
    logAction("Packet #2318 sent to the facility credentialing office");
  }

  function handleSecondary() {
    if (!packet || isSent || isReturned) return;
    returnPacketForDocuments(EDGE_CASE_PACKET_ID);
    addPacketNote(
      EDGE_CASE_PACKET_ID,
      PERSONA_NAME,
      "Returned to the tracker for more documents before resubmitting to Cedar Hollow."
    );
    logAction("Packet returned to the tracker for more documents");
  }

  const certificateDays = renewalCertificate ? daysUntil(renewalCertificate.expirationDate) : 0;
  const requirementDate = packet ? liabilityRequirementDate(packet) : null;

  return (
    <Screen>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Resubmission queue
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            Packets waiting for you to check them and send them back to the facility credentialing office.
            Nothing reaches a facility until you send it yourself.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div
              className={isSent ? "pointer-events-none opacity-60" : undefined}
              aria-disabled={isSent || undefined}
            >
              <ApprovalQueue
                items={items}
                primaryLabel="Send packet to facility"
                secondaryLabel="Return for more info"
                onPrimary={handlePrimary}
                onSecondary={handleSecondary}
                dataTour="approval-queue"
              />
            </div>
            {isReturned && (
              <p
                role="status"
                className="rounded-lg bg-[var(--pf-muted)]/15 px-3 py-2 text-sm text-[var(--pf-muted)]"
              >
                The queue is empty. Packet #2318 went back to the clearance tracker and is flagged for
                more documents.
              </p>
            )}
            {isSent && packet?.sentDate && (
              <p
                role="status"
                className="rounded-lg bg-[var(--pf-primary)]/10 px-3 py-2 text-sm text-[var(--pf-primary)]"
              >
                Sent to the Cedar Hollow credentialing office at {formatDateTime(packet.sentDate)}. Both
                actions are closed for this packet.
              </p>
            )}
            {packet && (
              <p className="text-sm text-[var(--pf-muted)]">
                First scheduled study at {packet.facilityName} is in{" "}
                {daysUntil(packet.firstShiftDate)} days, on {formatDate(packet.firstShiftDate)}.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-medium">Cedar Hollow's checklist</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {REQUIRED_ITEMS.map((item) => {
                  const isLiability = item === "Professional liability certificate";
                  return (
                    <li key={item} className="flex justify-between gap-3">
                      <span>{item}</span>
                      <span className="text-right text-[var(--pf-muted)]">
                        {isLiability
                          ? packet?.certificateAttached
                            ? "Attached"
                            : "Renewed certificate uploaded"
                          : "Accepted"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {renewalCertificate && (
              <DocumentViewer
                title="Renewed professional liability certificate"
                lines={[
                  `Status: ${packet?.certificateAttached ? "Attached" : renewalCertificate.status}`,
                  `Uploaded ${formatDate(renewalCertificate.uploadedDate)}`,
                  `Coverage runs through ${expirationLabel(renewalCertificate.expirationDate)}`,
                ]}
              />
            )}

            <DocumentViewer
              title="Draft cover note to the Cedar Hollow credentialing office"
              lines={[
                "To: Cedar Hollow Rehabilitation Hospital credentialing office",
                "Re: Packet #2318, T. Nakamura, speech-language pathologist",
                "The returned packet is resubmitted with a renewed professional liability certificate.",
                renewalCertificate && requirementDate
                  ? `Coverage now runs through ${formatDateWithYear(
                      renewalCertificate.expirationDate
                    )} (in ${certificateDays} days), well past the ${formatDateWithYear(
                      requirementDate
                    )} requirement.`
                  : "Coverage now runs through the renewed certificate's expiration date, past the required 30 days beyond the start date.",
                "The renewed certificate is attached. Please confirm acceptance when your review is complete.",
              ]}
            />
          </div>
        </div>

        <section>
          <h2 className="text-lg font-medium">Session audit log</h2>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">Every action taken here, newest first.</p>
          <div className="mt-3">
            <AuditLog />
          </div>
        </section>
      </div>
    </Screen>
  );
}
