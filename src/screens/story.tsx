import { useState } from "react";
import { OneClickLogin, StoryPanel, useActivity } from "@kit";
import {
  LOGIN_KEY,
  PERSONA_NAME,
  PERSONA_ROLE,
  PRACTICE_NAME,
  PRACTICE_TYPE,
  Screen,
  useLoggedIn,
} from "./_shell";

const DAY_IN_THE_LIFE =
  "Renata works Monday and Thursday mornings, about 6 hours a week. At 8:00am Monday she has 11 clearance packets in progress across 9 facilities, each with its own checklist: state license, professional liability certificate, background check, drug screen within the facility's window, signed contractor agreement, and facility orientation attestation. She cross-checks a shared drive folder per clinician against a spreadsheet of facility requirements, then emails three facility credentialing offices for status. At 9:40am she opens an email from Cedar Hollow Rehabilitation Hospital, sent the previous afternoon: packet #2318 for T. Nakamura was returned because the liability certificate expires in 12 days and the facility requires 30 days of coverage past the start date. Nakamura's first scheduled study there is in 4 days.";

const PAIN_POINTS = [
  "No single view of which clinician is cleared at which facility",
  "Expiration dates on licenses, insurance and drug screens are checked by opening files one at a time",
  "Facility rejections arrive by email and sit unread until the next working session",
  "Each facility's checklist differs, so the same clinician can be cleared at one site and blocked at another",
  "A clinician could start at a facility before every item is accepted, because nothing blocks scheduling",
];

const COST_OF_PAIN =
  "About 6 hours a week of manual cross-checking, and two delayed clinician starts last quarter that cancelled 4 scheduled study days at roughly $1,800 each, about $7,200 in lost revenue.";

const BEFORE =
  "8:00am Monday: Renata opens the requirements spreadsheet and 14 clinician folders. She checks expiration dates file by file and emails three facility offices for status. At 9:40am she finds Cedar Hollow's email from the day before: packet #2318 for T. Nakamura was returned because the liability certificate expires in 12 days, short of the 30-day rule. Nakamura starts there in 4 days. Renata texts the clinician for a renewed certificate and hopes it arrives before Thursday.";

const AFTER =
  "8:00am Monday: Renata opens the clearance tracker. Packet #2318 already sits at the top of Blocked clearances, flagged 'liability certificate expires too soon', with a countdown to Nakamura's first study in 4 days. The renewed certificate the clinician uploaded on Saturday is waiting. Renata attaches it, moves the packet to the resubmission queue, reads the cover note and checklist, and sends it to the facility herself. Nothing goes out on its own. By 8:20am she is working through the other 10 open packets, each showing which item is still missing.";

export default function Story() {
  const loggedIn = useLoggedIn();
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const { logAction } = useActivity();

  function handleLogin() {
    try {
      window.localStorage.setItem(LOGIN_KEY, "1");
    } catch {
      // localStorage unavailable; the demo still continues for this session.
    }
    setJustLoggedIn(true);
  }

  function handleStartTour() {
    logAction("Tour started");
    // On a first visit the tour auto-starts a moment after mount. If it is
    // not on screen by then, use the replay control the kit renders.
    window.setTimeout(() => {
      if (document.querySelector(".driver-popover")) return;
      const replay = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Replay tour"
      );
      replay?.click();
    }, 500);
  }

  if (!loggedIn && !justLoggedIn) {
    return (
      <OneClickLogin
        personaName={PERSONA_NAME}
        personaRole={PERSONA_ROLE}
        practiceName={PRACTICE_NAME}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <Screen>
      <StoryPanel
        practiceName={PRACTICE_NAME}
        practiceType={PRACTICE_TYPE}
        personaName={PERSONA_NAME}
        dayInTheLife={DAY_IN_THE_LIFE}
        painPoints={PAIN_POINTS}
        costOfPain={COST_OF_PAIN}
        before={BEFORE}
        after={AFTER}
        onStartTour={handleStartTour}
      />
    </Screen>
  );
}
