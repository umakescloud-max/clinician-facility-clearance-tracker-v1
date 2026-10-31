# A blocked start you can see on Monday morning

Small groups that send contract clinicians into hospitals, rehab hospitals and skilled nursing facilities all fight the same paperwork. Every facility wants its own clearance packet: state license, liability certificate, background check, a drug screen inside that facility's window, a signed contractor agreement, and often an orientation attestation. The same clinician can be cleared at one site and blocked at the next.

## Why it keeps happening

Documents live in one shared-drive folder per clinician. Facility rules live in a spreadsheet. Expiration dates get checked by opening files one at a time. A facility rejection arrives as an email and waits for the coordinator's next working session. And nothing stops a clinician from being scheduled before every item is accepted.

In the scenario we built for, a part-time coordinator keeps 14 contract speech-language pathologists cleared at 9 facilities in about 6 hours a week. Two delayed starts last quarter cancelled 4 study days at roughly $1,800 each. That is about $7,200 lost.

## What the prototype does

The Clearance tracker puts all 64 clinician-facility packets in one table. Each row shows status, the next missing item, and days until the clinician's first scheduled study. You can filter by facility.

Open a packet and you get its full timeline: documents, facility replies and follow-ups, with an expiration date next to each item.

The Blocked clearances screen holds the key case. A facility returned packet #2318 a day ago. The liability certificate expires in 12 days, and this facility requires coverage 30 days past the start date. The first study is in 4 days, shown as a countdown computed from the shift date. The drawer shows the renewed certificate the clinician already uploaded, valid for 377 days. The coordinator attaches it and moves the packet to the resubmission queue.

In the queue, the coordinator checks the facility checklist, reads the drafted cover note and clicks "Send packet to facility". Nothing goes out on its own. The tracker also shows four numbers computed from the packet data: pairs cleared, average days to clearance, blocked packets, and documents expiring in 30 days.

## How a real version would be built

Uploads would sit in encrypted storage. Claude would read expiration dates and check each facility's rules under a signed BAA, seeing only the fields it needs. Facility replies would feed the tracker. Slack would send the owner blocked-start alerts with a packet number and status only, never document images or background check results. Access would be limited to the owner and onboarding staff, with full audit logs. No packet is sent and no clinician is marked cleared without a staff click. It would run on the client's own Google Cloud project.

Try it: https://umakescloud-max.github.io/clinician-facility-clearance-tracker-v1/

This is a concept prototype built on synthetic data. A real build runs on the client's own cloud, is HIPAA-ready, and the client owns it.

If your team fights this every week, book a free workflow audit at umakes.cloud or reply to umakescloud@gmail.com.
