# Decisions

- Packet #2318 is seeded into the resubmission queue as well as the blocked list, because the brief's human checkpoint is on the resubmission queue and the gate requires that queue's edge-case `ApprovalItem` to exist on page load; moving the packet on the blocked screen is an in-memory action that is never persisted.
- "Active packets" in the clearance-rate metric means all 64 seeded clearance packets, including the four awaiting the facility and the three blocked ones.
- The reviewer asked for an empty "Add note" field to be ignored, but the gate contract requires an empty note field to append a timestamped default note (item 14). The gate wins: an empty note appends "Checked the packet. No new details were added." rather than the previous placeholder-sounding line, and the toast still fires.
- Packet state (status, next item, certificate attached, queue stage, send time, added notes) lives in one module-level store in `src/seed.ts` with a `useSyncExternalStore` subscription. It is intentionally never persisted, so a page reload returns the demo to the seeded blocked state the gate screenshots.
- The kit's `ApprovalQueue` has no disabled prop, so once a packet is sent the queue is wrapped in a `pointer-events-none opacity-60` container with `aria-disabled`, and the handlers guard against a second send or return.
