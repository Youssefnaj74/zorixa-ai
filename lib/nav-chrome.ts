import { SITE_ANNOUNCEMENT } from "@/lib/site-announcement";

export const NAVBAR_HEIGHT_PX = 56;
export const ANNOUNCEMENT_BANNER_HEIGHT_PX = 36;

/** Fixed top offset for studio pages (announcement bar + navbar when enabled). */
export const NAV_H = SITE_ANNOUNCEMENT.enabled
  ? NAVBAR_HEIGHT_PX + ANNOUNCEMENT_BANNER_HEIGHT_PX
  : NAVBAR_HEIGHT_PX;
