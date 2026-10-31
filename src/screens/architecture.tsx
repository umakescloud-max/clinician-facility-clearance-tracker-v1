import { ArchitectureView, IntegrationTiles, type ArchEdge, type ArchNode } from "@kit";
import { Screen } from "./_shell";

const NODES: ArchNode[] = [
  { id: "doc-store", label: "Clinician document storage", kind: "system" },
  { id: "facility-offices", label: "Facility credentialing offices", kind: "system" },
  { id: "tracker-ui", label: "Clearance tracker (this prototype)", kind: "app" },
  { id: "claude", label: "Claude (reads document dates and checks rules)", kind: "model" },
  { id: "slack", label: "Slack (owner alerts)", kind: "system" },
  { id: "staff", label: "Renata (onboarding coordinator)", kind: "human" },
];

const EDGES: ArchEdge[] = [
  { from: "doc-store", to: "tracker-ui", label: "Uploaded licenses, certificates, screens" },
  { from: "tracker-ui", to: "claude", label: "Extracts expiration dates, checks facility rules" },
  { from: "facility-offices", to: "tracker-ui", label: "Acceptance or return reason" },
  { from: "tracker-ui", to: "staff", label: "Surfaces blocked packets for review" },
  { from: "tracker-ui", to: "slack", label: "Blocked-start alert, no document contents" },
  { from: "staff", to: "facility-offices", label: "Sends packet, human-approved" },
];

const COMPLIANCE_NOTES = [
  "Clinician documents would be stored encrypted at rest and in transit",
  "Every packet sent to a facility requires explicit staff approval",
  "No clinician is marked cleared until a staff member confirms every required item was accepted",
  "Access is limited to the owner and onboarding staff, with full audit logging",
  "Alerts sent to chat carry only a packet number and status, never document images or background check results",
  "Document reading by a model runs only under a signed BAA, sharing the minimum fields needed",
];

export default function Architecture() {
  return (
    <Screen>
      <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
          How this would work
        </h1>
        <p className="mt-1 text-sm text-[var(--pf-muted)]">
          The systems a real clearance tracker would read from and write to, and the privacy choices that
          come with handling clinician documents.
        </p>
      </div>

      <ArchitectureView nodes={NODES} edges={EDGES} complianceNotes={COMPLIANCE_NOTES} />

      <IntegrationTiles
        tools={["Slack"]}
        excludeLabels={NODES.map((node) => node.label)}
        title="Named tool in this workflow"
      />
      </div>
    </Screen>
  );
}
