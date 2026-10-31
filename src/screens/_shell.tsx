import { useState, type ReactNode } from "react";
import { AppShell, TourRunner } from "@kit";
import tourSteps from "../tour.json";
import { NAV } from "../nav";

export const LOGIN_KEY = "pf-login-clinician-facility-clearance-tracker-v1";
export const TOUR_KEY = "pf-tour-clinician-facility-clearance-tracker-v1";
export const PERSONA_NAME = "Renata Okafor";
export const PERSONA_ROLE = "Clinician onboarding coordinator";
export const PRACTICE_NAME = "Northgate Mobile Dysphagia Services";
export const PRACTICE_TYPE =
  "Mobile instrumental swallow evaluations delivered on-site at hospitals, rehab hospitals and skilled nursing facilities in the South Central US";

export function useLoggedIn(): boolean {
  const [loggedIn] = useState(() => {
    try {
      return window.localStorage.getItem(LOGIN_KEY) === "1";
    } catch {
      return false;
    }
  });
  return loggedIn;
}

export function Screen({ children }: { children: ReactNode }) {
  const loggedIn = useLoggedIn();
  return (
    <AppShell
      brandName="Umakes.cloud"
      brandUrl="https://umakes.cloud"
      brandEmail="umakescloud@gmail.com"
      personaName={PERSONA_NAME}
      personaRole={PERSONA_ROLE}
      nav={NAV}
    >
      {children}
      {loggedIn && <TourRunner steps={tourSteps} storageKey={TOUR_KEY} />}
    </AppShell>
  );
}
