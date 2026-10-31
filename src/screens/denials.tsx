import { useState } from "react";
import {
  DataTable,
  RecordDrawer,
  ScenarioBanner,
  StatusPill,
  formatDate,
  useActivity,
  type DataTableColumn,
} from "@kit";
import { Screen, PERSONA_NAME } from "./_shell";
import {
  EDGE_CASE_PACKET_ID,
  attachRenewedCertificate,
  daysUntil,
  documents,
  expirationLabel,
  formatDateWithYear,
  liabilityRequirementDate,
  movePacketToResubmission,
  statusLabel,
  statusTone,
  usePackets,
  type Packet,
} from "../seed";

export default function Denials() {
  const { logAction } = useActivity();
  const allPackets = usePackets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const edgePacket = allPackets.find((packet) => packet.id === EDGE_CASE_PACKET_ID);
  const blockedPackets = allPackets.filter((packet) => packet.status === "blocked");
  const selected = allPackets.find((packet) => packet.id === selectedId) ?? null;

  const currentCertificate = documents.find(
    (document) =>
      document.clinicianId === "C-11" && document.documentType === "Professional liability certificate"
  );
  const renewalCertificate = documents.find(
    (document) =>
      document.clinicianId === "C-11" &&
      document.documentType === "Professional liability certificate (renewal)"
  );

  const shiftDays = edgePacket ? daysUntil(edgePacket.firstShiftDate) : 0;

  // The banner and the countdown card stay on the screen after the packet
  // moves, so their copy has to follow the shared packet state.
  const stateLine = edgePacket
    ? edgePacket.queueStage === "sent"
      ? "Packet sent to Cedar Hollow and awaiting facility review."
      : edgePacket.queueStage === "queued"
        ? edgePacket.certificateAttached
          ? "Renewed certificate attached. Packet is in the resubmission queue."
          : "Packet is in the resubmission queue. The renewed certificate still needs attaching."
        : edgePacket.queueStage === "returned"
          ? "Packet returned to the tracker for more documents."
          : edgePacket.certificateAttached
            ? "Renewed certificate attached. Move the packet to the resubmission queue when you are ready."
            : "The packet cannot be resubmitted until the certificate is renewed."
    : "No packet is currently blocked.";

  const columns: DataTableColumn<Packet>[] = [
    {
      key: "packet",
      header: "Packet",
      render: (packet) => (
        <span>
          <span className="font-medium">#{packet.id}</span>
          <span className="block text-xs text-[var(--pf-muted)]">{packet.blockedReason ?? ""}</span>
        </span>
      ),
    },
    {
      key: "clinician",
      header: "Clinician",
      render: (packet) => packet.clinicianName,
    },
    {
      key: "facility",
      header: "Facility",
      render: (packet) => packet.facilityName,
    },
    {
      key: "blockedItem",
      header: "Item holding the packet",
      render: (packet) => packet.blockedItem ?? "",
    },
    {
      key: "status",
      header: "Status",
      render: (packet) => <StatusPill label={statusLabel(packet.status)} tone={statusTone(packet.status)} />,
    },
    {
      key: "firstShift",
      header: "First study",
      render: (packet) => {
        const days = daysUntil(packet.firstShiftDate);
        return days >= 0 ? `In ${days} days` : `Started ${formatDate(packet.firstShiftDate)}`;
      },
    },
  ];

  function handleAttach() {
    attachRenewedCertificate(EDGE_CASE_PACKET_ID);
    logAction("Renewed liability certificate attached to packet #2318");
  }

  function handleMove() {
    movePacketToResubmission(EDGE_CASE_PACKET_ID);
    logAction("Packet #2318 moved to the resubmission queue");
    setSelectedId(null);
  }

  return (
    <Screen>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Blocked clearances
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            Every packet a facility returned, or that fails one of the facility's own rules, with the item
            that is holding it and how long until the first scheduled study.
          </p>
        </div>

        <ScenarioBanner
          title="Cedar Hollow returned packet #2318"
          body={
            currentCertificate
              ? `The professional liability certificate on file expires ${expirationLabel(currentCertificate.expirationDate)}. Cedar Hollow requires coverage valid for at least 30 days past the start date, and the first study is in ${shiftDays} days. Every other item in the packet was accepted. ${stateLine}`
              : stateLine
          }
        />

        <div
          data-tour="appeal-countdown"
          className="rounded-xl border border-[var(--pf-primary)]/30 bg-[var(--pf-primary)]/5 p-4"
        >
          <p className="text-xs text-[var(--pf-muted)]">First scheduled study at Cedar Hollow</p>
          <p className="mt-1 text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            {edgePacket ? `In ${shiftDays} days` : "No blocked start"}
          </p>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            {edgePacket
              ? `${edgePacket.clinicianName}, ${formatDate(edgePacket.firstShiftDate)}. ${stateLine}`
              : "No packet is currently blocked."}
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={blockedPackets}
          rowKey={(packet) => packet.id}
          onRowClick={(packet) => setSelectedId(packet.id)}
          dataTour="denial"
          mobileStatusKey="status"
          mobileUrgencyKey="firstShift"
          edgeCaseRow={(packet) => packet.id === EDGE_CASE_PACKET_ID}
        />

        <RecordDrawer
          open={selected !== null}
          title={selected ? `Packet #${selected.id}` : "Blocked packet"}
          onClose={() => setSelectedId(null)}
        >
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={statusLabel(selected.status)} tone={statusTone(selected.status)} />
                <span className="text-[var(--pf-muted)]">{selected.clinicianName}</span>
              </div>

              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Facility</dt>
                  <dd className="text-right">{selected.facilityName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Opened</dt>
                  <dd>{formatDate(selected.openedDate)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Returned</dt>
                  <dd>{selected.returnedDate ? formatDate(selected.returnedDate) : "Not returned"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">First study</dt>
                  <dd className="text-right">
                    {formatDate(selected.firstShiftDate)} (in {daysUntil(selected.firstShiftDate)} days)
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Items accepted</dt>
                  <dd>
                    {selected.itemsAccepted} of {selected.itemsRequired}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Blocked item</dt>
                  <dd className="text-right">{selected.blockedItem}</dd>
                </div>
              </dl>

              {selected.id === EDGE_CASE_PACKET_ID ? (
                <div className="space-y-4">
                  <p className="rounded-lg bg-[var(--pf-accent)] px-3 py-2 text-[var(--pf-ink)]">
                    {selected.blockedReason
                      ? selected.blockedReason.charAt(0).toUpperCase() + selected.blockedReason.slice(1)
                      : "Returned with an item to fix"}
                    . The certificate must run through{" "}
                    {formatDateWithYear(liabilityRequirementDate(selected))}.
                  </p>

                  {currentCertificate && (
                    <div className="rounded-lg border border-[var(--pf-muted)]/20 p-3">
                      <p className="font-medium">Certificate on file</p>
                      <p className="mt-1 text-[var(--pf-muted)]">
                        Expires {expirationLabel(currentCertificate.expirationDate)}.
                      </p>
                    </div>
                  )}

                  {renewalCertificate && (
                    <div className="rounded-lg border border-[var(--pf-primary)]/30 p-3">
                      <p className="font-medium">Renewed certificate uploaded</p>
                      <p className="mt-1 text-[var(--pf-muted)]">
                        Uploaded {formatDate(renewalCertificate.uploadedDate)}; expires{" "}
                        {expirationLabel(renewalCertificate.expirationDate)}.
                      </p>
                      {selected.certificateAttached && (
                        <p className="mt-2 text-[var(--pf-primary)]">
                          Attached to the packet. Ready to resubmit.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAttach}
                      className="min-h-[44px] rounded-lg bg-[var(--pf-primary)] px-4 py-2 text-sm font-medium text-[var(--pf-surface)]"
                    >
                      Attach renewed certificate
                    </button>
                    <button
                      type="button"
                      onClick={handleMove}
                      className="min-h-[44px] rounded-lg border border-[var(--pf-primary)]/40 px-4 py-2 text-sm font-medium text-[var(--pf-primary)]"
                    >
                      Move to resubmission
                    </button>
                  </div>
                  <p className="text-xs text-[var(--pf-muted)]">
                    {PERSONA_NAME} moves this packet herself. Nothing leaves the tracker automatically.
                  </p>
                </div>
              ) : (
                <p className="text-[var(--pf-muted)]">
                  Waiting on the {selected.blockedItem?.toLowerCase()}. Open the packet from the tracker to
                  see its full checklist and timeline.
                </p>
              )}
            </div>
          )}
        </RecordDrawer>
      </div>
    </Screen>
  );
}
