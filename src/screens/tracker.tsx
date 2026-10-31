import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  MetricPanel,
  StatusPill,
  useActivity,
  formatDate,
  type DataTableColumn,
} from "@kit";
import { Screen } from "./_shell";
import {
  clinicians,
  daysUntil,
  documents,
  facilities,
  statusLabel,
  statusTone,
  usePackets,
  type Packet,
} from "../seed";

const DAY = 24 * 60 * 60 * 1000;

export default function Tracker() {
  const navigate = useNavigate();
  const { logAction } = useActivity();
  const packets = usePackets();
  const [draftFacility, setDraftFacility] = useState("all");
  const [appliedFacility, setAppliedFacility] = useState("all");

  const cleared = packets.filter((packet) => packet.status === "cleared");
  const recentCleared = cleared.filter(
    (packet) => packet.clearedDate !== null && daysUntil(packet.clearedDate) >= -90
  );
  const averageDays =
    recentCleared.length > 0
      ? recentCleared.reduce(
          (sum, packet) =>
            sum + Math.round((packet.clearedDate!.getTime() - packet.openedDate.getTime()) / DAY),
          0
        ) / recentCleared.length
      : 0;
  const blocked = packets.filter((packet) => packet.status === "blocked");
  const returnedThisWeek = blocked.filter(
    (packet) => packet.returnedDate !== null && daysUntil(packet.returnedDate) >= -7
  ).length;
  const expiringDocuments = documents.filter((document) => {
    const days = daysUntil(document.expirationDate);
    return days >= 0 && days <= 30;
  });

  const metrics = [
    {
      label: "Clinician-facility pairs cleared",
      value: `${Math.round((cleared.length / packets.length) * 100)}%`,
      hint: `${cleared.length} of ${packets.length} active packets`,
    },
    {
      label: "Average days to clearance",
      value: `${averageDays.toFixed(1)} days`,
      hint: `Across ${recentCleared.length} packets cleared in the last 90 days`,
    },
    {
      label: "Blocked packets",
      value: `${blocked.length}`,
      hint: `${returnedThisWeek} returned by a facility in the last 7 days`,
    },
    {
      label: "Documents expiring in 30 days",
      value: `${expiringDocuments.length}`,
      hint: `Across all ${clinicians.length} contract clinicians`,
    },
  ];

  const visiblePackets =
    appliedFacility === "all"
      ? packets
      : packets.filter((packet) => packet.facilityId === appliedFacility);

  const appliedFacilityName =
    appliedFacility === "all"
      ? null
      : facilities.find((facility) => facility.id === appliedFacility)?.name ?? null;

  const columns: DataTableColumn<Packet>[] = [
    {
      key: "clinician",
      header: "Clinician",
      render: (packet) => (
        <span>
          <span className="font-medium">{packet.clinicianName}</span>
          <span className="block text-xs text-[var(--pf-muted)]">#{packet.id}</span>
          {/* The mobile card layout collapses other columns into a closed
              "Details" block, so the next missing item gets its own line on
              the card itself. */}
          <span className="block text-xs text-[var(--pf-muted)] sm:hidden">
            Next item: {packet.nextItem}
          </span>
        </span>
      ),
    },
    {
      key: "facility",
      header: "Facility",
      render: (packet) => packet.facilityName,
    },
    {
      key: "status",
      header: "Status",
      render: (packet) => <StatusPill label={statusLabel(packet.status)} tone={statusTone(packet.status)} />,
    },
    {
      key: "nextItem",
      header: "Next item",
      render: (packet) => packet.nextItem,
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

  function handleFilter() {
    setAppliedFacility(draftFacility);
    logAction("Showing packets for the selected facility");
  }

  function handleRowClick(packet: Packet) {
    logAction("Opened packet #2318 for review");
    navigate(`/packet?case=${packet.id}`);
  }

  return (
    <Screen>
      <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
          Clearance tracker
        </h1>
        <p className="mt-1 text-sm text-[var(--pf-muted)]">
          Every clinician-facility clearance packet, with the next missing item and the days until the
          first scheduled study. Open a packet to see its history.
        </p>
      </div>

      <MetricPanel metrics={metrics} dataTour="metric-panel" />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--pf-muted)]/20 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="facility-filter" className="text-sm text-[var(--pf-muted)]">
            Facility
          </label>
          <select
            id="facility-filter"
            value={draftFacility}
            onChange={(event) => setDraftFacility(event.target.value)}
            className="min-h-[44px] rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] px-3 py-2 text-sm"
          >
            <option value="all">All facilities</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleFilter}
          className="min-h-[44px] rounded-lg bg-[var(--pf-primary)] px-4 py-2 text-sm font-medium text-[var(--pf-surface)]"
        >
          Filter by facility
        </button>
        <p className="text-sm text-[var(--pf-muted)]" aria-live="polite">
          {appliedFacilityName
            ? `Showing ${visiblePackets.length} packets at ${appliedFacilityName}.`
            : `Showing all ${visiblePackets.length} packets across ${facilities.length} facilities.`}
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={visiblePackets}
        rowKey={(packet) => packet.id}
        onRowClick={handleRowClick}
        dataTour="tracker-table"
        mobileStatusKey="status"
        mobileUrgencyKey="firstShift"
      />
      </div>
    </Screen>
  );
}
