/** Reserved height for the fixed bottom composer — keeps preview from jumping. */

/** Action tabs row (Text to Video / Image to Image, etc.) — pinned on the dock. */
export const STUDIO_ACTION_TABS_HEIGHT = 52;

export const COMPOSER_DOCK_DEFAULT_HEIGHT = 130;

/** Video · Seedance 2.0 Reference to Video body (uploads + prompt + controls). */
export const VIDEO_SEEDANCE_R2V_BODY_HEIGHT = 268;

/** Full video dock including tabs when Seedance R2V is active. */
export const VIDEO_SEEDANCE_R2V_DOCK_HEIGHT =
  VIDEO_SEEDANCE_R2V_BODY_HEIGHT + STUDIO_ACTION_TABS_HEIGHT;

/** Video · Wan 2.7 Reference to Video — same layout as Seedance R2V panel. */
export const VIDEO_WAN_R2V_DOCK_HEIGHT = VIDEO_SEEDANCE_R2V_DOCK_HEIGHT;

/** Image · Image to Image body. */
export const IMAGE_I2I_BODY_HEIGHT = 200;

export const IMAGE_I2I_DOCK_HEIGHT = IMAGE_I2I_BODY_HEIGHT + STUDIO_ACTION_TABS_HEIGHT;

/** Default video/image dock including tabs. */
export const COMPOSER_DOCK_WITH_TABS_HEIGHT =
  COMPOSER_DOCK_DEFAULT_HEIGHT + STUDIO_ACTION_TABS_HEIGHT;
