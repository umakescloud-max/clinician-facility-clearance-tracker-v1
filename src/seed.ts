import { useSyncExternalStore } from "react";
import {
  createNameGenerator,
  fakePhone,
  randomInt,
  rel,
  rng,
  shuffle,
  type StatusTone,
} from "@kit";

// Deterministic seed data for the clinician-facility clearance tracker.
// Every date is produced with rel() so "today" in the demo is always today.

const DAY = 24 * 60 * 60 * 1000;
const rand = rng("clinician-facility-clearance-tracker-v1");

export type PacketStatus = "cleared" | "in progress" | "awaiting facility" | "blocked";
export type QueueStage = "none" | "queued" | "sent" | "returned";

export interface Clinician {
  id: string;
  name: string;
  credential: string;
  contractType: string;
  phone: string;
  startWithGroupDate: Date;
  active: boolean;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  region: string;
  drugScreenWindowDays: number;
  liabilityMinDaysPastStart: number;
  requiresOrientationAttestation: boolean;
}

export interface Packet {
  id: string;
  clinicianId: string;
  clinicianName: string;
  facilityId: string;
  facilityName: string;
  openedDate: Date;
  firstShiftDate: Date;
  status: PacketStatus;
  blockedItem: string | null;
  blockedReason: string | null;
  returnedDate: Date | null;
  clearedDate: Date | null;
  itemsAccepted: number;
  itemsRequired: number;
  resubmissionStatus: "none" | "sent";
  nextItem: string;
  /** Shared runtime state: the renewed certificate has been attached. */
  certificateAttached: boolean;
  /** Where the packet sits in the resubmission flow. */
  queueStage: QueueStage;
  /** When the packet was last sent to the facility, if it has been. */
  sentDate: Date | null;
}

export interface ClinicianDocument {
  id: string;
  clinicianId: string;
  documentType: string;
  issuedDate: Date;
  expirationDate: Date;
  status: string;
  uploadedDate: Date;
}

export interface PacketNote {
  id: string;
  packetId: string;
  author: string;
  timestamp: Date;
  text: string;
}

export const EDGE_CASE_PACKET_ID = "2318";
export const EDGE_CASE_LABEL = "liability certificate expires too soon";

export const REQUIRED_ITEMS = [
  "State license",
  "Professional liability certificate",
  "Background check",
  "Drug screen",
  "Signed contractor agreement",
  "Facility orientation attestation",
];

export const DOCUMENT_TYPES = [
  "State license",
  "Professional liability certificate",
  "Background check",
  "Drug screen",
  "Signed contractor agreement",
  "Policy acknowledgment",
];

export const facilities: Facility[] = [
  {
    id: "F-01",
    name: "Cedar Hollow Rehabilitation Hospital",
    type: "rehab hospital",
    region: "Cedar Hollow",
    drugScreenWindowDays: 30,
    liabilityMinDaysPastStart: 30,
    requiresOrientationAttestation: true,
  },
  {
    id: "F-02",
    name: "Pine Ridge Medical Center",
    type: "hospital",
    region: "Pine Ridge",
    drugScreenWindowDays: 90,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: true,
  },
  {
    id: "F-03",
    name: "Lakemont Skilled Nursing",
    type: "skilled nursing facility",
    region: "Lakemont",
    drugScreenWindowDays: 30,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: true,
  },
  {
    id: "F-04",
    name: "Willow Bend Care Center",
    type: "skilled nursing facility",
    region: "Willow Bend",
    drugScreenWindowDays: 30,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: false,
  },
  {
    id: "F-05",
    name: "Stonebridge Regional Hospital",
    type: "hospital",
    region: "Stonebridge",
    drugScreenWindowDays: 90,
    liabilityMinDaysPastStart: 30,
    requiresOrientationAttestation: true,
  },
  {
    id: "F-06",
    name: "Maple Court Rehabilitation",
    type: "rehab hospital",
    region: "Maple Court",
    drugScreenWindowDays: 30,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: false,
  },
  {
    id: "F-07",
    name: "Riverbend Health and Rehab",
    type: "skilled nursing facility",
    region: "Riverbend",
    drugScreenWindowDays: 90,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: true,
  },
  {
    id: "F-08",
    name: "Fairhaven Nursing Center",
    type: "skilled nursing facility",
    region: "Fairhaven",
    drugScreenWindowDays: 30,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: false,
  },
  {
    id: "F-09",
    name: "Oak Terrace Post-Acute",
    type: "hospital",
    region: "Oak Terrace",
    drugScreenWindowDays: 90,
    liabilityMinDaysPastStart: 0,
    requiresOrientationAttestation: false,
  },
];

const nameGenerator = createNameGenerator(rand);

export const clinicians: Clinician[] = Array.from({ length: 14 }, (_, i) => {
  const id = `C-${String(i + 1).padStart(2, "0")}`;
  const isNakamura = i === 10;
  const isOffboarded = i === 13;
  return {
    id,
    name: isNakamura ? "T. Nakamura" : nameGenerator.next(),
    credential: "CCC-SLP",
    contractType: "independent contractor",
    phone: fakePhone(rand),
    startWithGroupDate: isNakamura
      ? rel(-40)
      : isOffboarded
        ? rel(-730)
        : rel(-randomInt(rand, 20, 720)),
    active: !isOffboarded,
  };
});

const nakamura = clinicians[10];
const cedarHollow = facilities[0];

const allPairs: { clinician: Clinician; facility: Facility }[] = [];
for (const clinician of clinicians) {
  for (const facility of facilities) {
    allPairs.push({ clinician, facility });
  }
}
const availablePairs = shuffle(rand, allPairs).filter(
  (pair) => !(pair.clinician.id === nakamura.id && pair.facility.id === cedarHollow.id)
);
const chosenPairs = availablePairs.slice(0, 63);

const allIds = Array.from({ length: 131 }, (_, i) => String(2200 + i)).filter(
  (id) => id !== EDGE_CASE_PACKET_ID
);
const otherIds = shuffle(rand, allIds).slice(0, 63);

// Status plan: the edge-case packet is blocked, then two more blocked, four
// awaiting the facility, eleven in progress, and forty-six cleared.
const statusPlan: PacketStatus[] = [
  ...Array.from({ length: 3 }, () => "blocked" as PacketStatus),
  ...Array.from({ length: 4 }, () => "awaiting facility" as PacketStatus),
  ...Array.from({ length: 11 }, () => "in progress" as PacketStatus),
  ...Array.from({ length: 46 }, () => "cleared" as PacketStatus),
];

function makePacket(
  id: string,
  clinician: Clinician,
  facility: Facility,
  status: PacketStatus
): Packet {
  let openedDate: Date;
  let firstShiftDate: Date;
  let clearedDate: Date | null = null;
  let returnedDate: Date | null = null;
  let blockedItem: string | null = null;
  let blockedReason: string | null = null;
  let itemsAccepted: number;
  let nextItem: string;

  if (status === "cleared") {
    const clearDays = randomInt(rand, 6, 21);
    clearedDate = rel(-randomInt(rand, 0, 50));
    openedDate = new Date(clearedDate.getTime() - clearDays * DAY);
    firstShiftDate = rel(-randomInt(rand, 1, 15));
    itemsAccepted = 6;
    nextItem = "All items accepted";
  } else if (status === "blocked") {
    openedDate = rel(-randomInt(rand, 8, 22));
    firstShiftDate = rel(randomInt(rand, 4, 20));
    returnedDate = rel(-randomInt(rand, 1, 4));
    itemsAccepted = randomInt(rand, 4, 5);
    nextItem = "Blocked item under review";
  } else if (status === "awaiting facility") {
    openedDate = rel(-randomInt(rand, 4, 24));
    firstShiftDate = rel(randomInt(rand, 4, 25));
    itemsAccepted = 6;
    nextItem = "Awaiting facility review";
  } else {
    openedDate = rel(-randomInt(rand, 2, 28));
    firstShiftDate = rel(randomInt(rand, 4, 25));
    itemsAccepted = randomInt(rand, 2, 5);
    nextItem = REQUIRED_ITEMS[Math.min(itemsAccepted, REQUIRED_ITEMS.length - 1)];
  }

  return {
    id,
    clinicianId: clinician.id,
    clinicianName: clinician.name,
    facilityId: facility.id,
    facilityName: facility.name,
    openedDate,
    firstShiftDate,
    status,
    blockedItem,
    blockedReason,
    returnedDate,
    clearedDate,
    itemsAccepted,
    itemsRequired: 6,
    resubmissionStatus: "none",
    nextItem,
    certificateAttached: false,
    queueStage: "none",
    sentDate: null,
  };
}

const edgePacket: Packet = {
  id: EDGE_CASE_PACKET_ID,
  clinicianId: nakamura.id,
  clinicianName: nakamura.name,
  facilityId: cedarHollow.id,
  facilityName: cedarHollow.name,
  openedDate: rel(-14),
  firstShiftDate: rel(4),
  status: "blocked",
  blockedItem: "Professional liability certificate",
  blockedReason: EDGE_CASE_LABEL,
  returnedDate: rel(-1),
  clearedDate: null,
  itemsAccepted: 5,
  itemsRequired: 6,
  resubmissionStatus: "none",
  nextItem: "Professional liability certificate",
  certificateAttached: false,
  queueStage: "none",
  sentDate: null,
};

export const packets: Packet[] = [edgePacket];

for (let i = 0; i < otherIds.length; i++) {
  const status = statusPlan[i + 1];
  const pair = chosenPairs[i];
  const packet = makePacket(otherIds[i], pair.clinician, pair.facility, status);
  if (status === "blocked") {
    if (i === 0) {
      packet.blockedItem = "Drug screen";
      packet.blockedReason = "drug screen older than facility window";
    } else {
      packet.blockedItem = "Facility orientation attestation";
      packet.blockedReason = "orientation attestation not signed";
    }
    packet.nextItem = packet.blockedItem;
  }
  packets.push(packet);
}

export const documents: ClinicianDocument[] = [];

const expiringByClinician: Record<string, string> = {
  "C-02": "State license",
  "C-04": "Drug screen",
  "C-06": "Background check",
  "C-08": "Policy acknowledgment",
  "C-10": "State license",
  "C-13": "Professional liability certificate",
};

for (const clinician of clinicians) {
  DOCUMENT_TYPES.forEach((documentType, index) => {
    let issuedDate: Date;
    let expirationDate: Date;

    switch (documentType) {
      case "State license":
        issuedDate = rel(-randomInt(rand, 200, 500));
        expirationDate = rel(randomInt(rand, 190, 720));
        break;
      case "Professional liability certificate":
        issuedDate = rel(-randomInt(rand, 300, 360));
        expirationDate = rel(randomInt(rand, 80, 340));
        break;
      case "Background check":
        issuedDate = rel(-randomInt(rand, 90, 700));
        expirationDate = rel(randomInt(rand, 120, 900));
        break;
      case "Drug screen": {
        issuedDate = rel(-randomInt(rand, 5, 80));
        expirationDate = new Date(issuedDate.getTime() + 365 * DAY);
        break;
      }
      case "Signed contractor agreement":
        issuedDate = rel(-randomInt(rand, 30, 400));
        expirationDate = rel(randomInt(rand, 150, 600));
        break;
      default:
        issuedDate = rel(-randomInt(rand, 30, 600));
        expirationDate = rel(randomInt(rand, 200, 800));
    }

    if (expiringByClinician[clinician.id] === documentType) {
      expirationDate = rel(randomInt(rand, 4, 28));
    }

    documents.push({
      id: `D-${clinician.id.replace("C-", "")}-${index + 1}`,
      clinicianId: clinician.id,
      documentType,
      issuedDate,
      expirationDate,
      status: "accepted",
      uploadedDate: issuedDate,
    });
  });
}

const nakamuraLiability = documents.find(
  (document) => document.clinicianId === "C-11" && document.documentType === "Professional liability certificate"
);
if (nakamuraLiability) {
  nakamuraLiability.expirationDate = rel(12);
  nakamuraLiability.status = "returned, expires too soon";
}

documents.push({
  id: "D-11-7",
  clinicianId: "C-11",
  documentType: "Professional liability certificate (renewal)",
  issuedDate: rel(-4),
  expirationDate: rel(377),
  status: "uploaded, not yet attached",
  uploadedDate: rel(-2),
});

const NOTE_TEXTS = [
  "Emailed the facility credentialing office to confirm what the checklist needs.",
  "Facility office confirmed receipt, review takes about 5 business days.",
  "Asked clinician for a drug screen dated within 30 days.",
  "Clinician uploaded renewed documents to the shared folder.",
  "Left a voicemail with the clinician about the missing orientation attestation.",
  "Checked the facility requirements against the packet checklist.",
];

export const packetNotes: PacketNote[] = [];

for (const packet of packets) {
  if (packet.id === EDGE_CASE_PACKET_ID) {
    packetNotes.push({
      id: "N-2318-1",
      packetId: "2318",
      author: "Renata Okafor",
      timestamp: rel(-12, "10:20"),
      text: "Clinician confirmed availability for the first study date at Cedar Hollow.",
    });
    packetNotes.push({
      id: "N-2318-2",
      packetId: "2318",
      author: "Cedar Hollow credentialing office",
      timestamp: rel(-1, "16:05"),
      text: "Facility returned packet: liability coverage must run 30 days past start date.",
    });
    packetNotes.push({
      id: "N-2318-3",
      packetId: "2318",
      author: "T. Nakamura",
      timestamp: rel(-2, "14:12"),
      text: `Uploaded a renewed professional liability certificate, valid through ${formatDateWithYear(rel(377))}.`,
    });
    continue;
  }

  const count = randomInt(rand, 2, 3);
  const openedAt = packet.openedDate.getTime();
  const elapsed = Math.max(DAY, Date.now() - openedAt);
  for (let n = 0; n < count; n++) {
    packetNotes.push({
      id: `N-${packet.id}-${n + 1}`,
      packetId: packet.id,
      author: n % 2 === 0 ? "Renata Okafor" : "Facility credentialing office",
      timestamp: new Date(openedAt + elapsed * ((n + 1) / (count + 1))),
      text: NOTE_TEXTS[(Number(packet.id) + n) % NOTE_TEXTS.length],
    });
  }
}

export function packetsById(id: string): Packet | undefined {
  return packets.find((packet) => packet.id === id);
}

export function documentsForClinician(clinicianId: string): ClinicianDocument[] {
  return documents.filter((document) => document.clinicianId === clinicianId);
}

export function notesForPacket(packetId: string): PacketNote[] {
  return packetNotes
    .filter((note) => note.packetId === packetId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/** Whole calendar days from today to `target`; negative when the date is past. */
export function daysUntil(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / DAY);
}

export function statusLabel(status: PacketStatus): string {
  switch (status) {
    case "cleared":
      return "Cleared";
    case "in progress":
      return "In progress";
    case "awaiting facility":
      return "Awaiting facility";
    case "blocked":
      return "Blocked";
  }
}

export function statusTone(status: PacketStatus): StatusTone {
  if (status === "cleared") return "primary";
  if (status === "blocked") return "accent";
  return "muted";
}

/** A date with its year, so two certificates that share a month and day stay distinct. */
export function formatDateWithYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** An expiration date with its year and the days remaining from today. */
export function expirationLabel(d: Date): string {
  const days = daysUntil(d);
  if (days === 0) return `${formatDateWithYear(d)}, today`;
  if (days > 0) return `${formatDateWithYear(d)}, in ${days} ${days === 1 ? "day" : "days"}`;
  const ago = Math.abs(days);
  return `${formatDateWithYear(d)}, ${ago} ${ago === 1 ? "day" : "days"} ago`;
}

/** The date coverage must run through for this packet's facility rule. */
export function liabilityRequirementDate(packet: Packet): Date {
  const facility = facilities.find((candidate) => candidate.id === packet.facilityId);
  const required = facility ? facility.liabilityMinDaysPastStart : 0;
  const requirement = new Date(packet.firstShiftDate);
  requirement.setDate(requirement.getDate() + required);
  return requirement;
}

// ---------------------------------------------------------------------------
// Shared packet store. Every screen reads and writes the same module-level
// packet objects, so a move on Blocked clearances is visible on the tracker,
// the packet page and the resubmission queue without a page reload.
// ---------------------------------------------------------------------------

type PacketListener = () => void;
const packetListeners = new Set<PacketListener>();
let packetVersion = 0;

function notifyPackets(): void {
  packetVersion += 1;
  for (const listener of packetListeners) listener();
}

function subscribePackets(listener: PacketListener): () => void {
  packetListeners.add(listener);
  return () => {
    packetListeners.delete(listener);
  };
}

function getPacketVersion(): number {
  return packetVersion;
}

/** Subscribes the calling screen to the shared packet state. */
export function usePackets(): Packet[] {
  useSyncExternalStore(subscribePackets, getPacketVersion, getPacketVersion);
  return packets;
}

export function attachRenewedCertificate(packetId: string): void {
  const packet = packetsById(packetId);
  if (!packet) return;
  packet.certificateAttached = true;
  notifyPackets();
}

export function movePacketToResubmission(packetId: string): void {
  const packet = packetsById(packetId);
  if (!packet) return;
  packet.queueStage = "queued";
  packet.status = "in progress";
  packet.nextItem = "Resubmission review";
  notifyPackets();
}

export function sendPacketToFacility(packetId: string): void {
  const packet = packetsById(packetId);
  if (!packet || packet.queueStage === "sent") return;
  packet.queueStage = "sent";
  packet.status = "awaiting facility";
  packet.nextItem = "Awaiting facility review";
  packet.sentDate = new Date();
  notifyPackets();
}

export function returnPacketForDocuments(packetId: string): void {
  const packet = packetsById(packetId);
  if (!packet) return;
  packet.queueStage = "returned";
  packet.status = "in progress";
  packet.nextItem = "Professional liability certificate";
  notifyPackets();
}

export function addPacketNote(packetId: string, author: string, text: string): void {
  packetNotes.push({
    id: `N-${packetId}-${Date.now()}`,
    packetId,
    author,
    timestamp: new Date(),
    text,
  });
  notifyPackets();
}
