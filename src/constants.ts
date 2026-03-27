import type { AvatarConfig, TextConfig, AnimationConfig } from "./types";

export const CANVAS_SIZE = 300;
export const BG_IMAGE_PATH = "/hero-bg.webp";
export const BG_IMAGE_MIME_TYPE = "image/webp";
export const DEFAULT_PREVIEW_CYCLE_DURATION_MS = 700;
export const MIN_PREVIEW_CYCLE_DURATION_MS = 100;
export const DEFAULT_BOUNCE_ALIGNMENT_OFFSET_MS = -600;

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  size: 70,
  x: 93,
  y: 74,
  shape: 'circle',
  borderColor: '#262626',
};

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  content: "快做啊！",
  x: 50,
  y: 92,
  size: 30,
};

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  spinSpeed: 0.5,
  delay: 0,
  rotationMode: 'flat',
};
