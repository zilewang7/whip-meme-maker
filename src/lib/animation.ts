import { DEFAULT_BOUNCE_ALIGNMENT_OFFSET_MS } from '../constants';
import type { AnimationConfig, RotationMode } from '../types';

const TAU = Math.PI * 2;
const IMPACT_PROGRESS = 0.08;
const IMPACT_WIDTH = 0.055;
const IMPACT_PULSE_MEAN = 0.138;

export interface BounceState {
  readonly translateY: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

interface BounceKeyframe {
  readonly t: number;
  readonly translateY: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

const BOUNCE_KEYFRAMES: readonly BounceKeyframe[] = [
  { t: 0, translateY: 0, scaleX: 1, scaleY: 1 },
  { t: 0.1, translateY: 0.15, scaleX: 1.3, scaleY: 0.7 },
  { t: 0.25, translateY: -0.15, scaleX: 0.9, scaleY: 1.1 },
  { t: 0.45, translateY: 0, scaleX: 1, scaleY: 1 },
  { t: 1, translateY: 0, scaleX: 1, scaleY: 1 },
];

export interface RotationFrameState {
  readonly mode: RotationMode;
  readonly angleRad: number;
  readonly brightness: number;
  readonly saturation: number;
  readonly shadeOpacity: number;
  readonly highlightOpacity: number;
  readonly horizontalScale: number;
}

export interface AnimationFrameState {
  readonly bounce: BounceState;
  readonly bounceProgress: number;
  readonly rotation: RotationFrameState;
  readonly nextRotationAngleRad: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCycleProgress(elapsedMs: number, cycleDurationMs: number, delayMs: number): number {
  if (cycleDurationMs <= 0) {
    return 0;
  }

  const shiftedElapsedMs = elapsedMs + delayMs;
  const normalizedElapsedMs =
    ((shiftedElapsedMs % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;

  return normalizedElapsedMs / cycleDurationMs;
}

function getWrappedDistance(value: number, target: number): number {
  return ((value - target + 0.5) % 1 + 1) % 1 - 0.5;
}

function getGaussianPulse(distance: number, width: number): number {
  return Math.exp(-(distance * distance) / (2 * width * width));
}

function getSpinVelocityMultiplier(
  baseSpinProgress: number,
  bounceProgress: number,
  rotationMode: RotationMode,
): number {
  if (rotationMode === 'flat') {
    return 1;
  }

  const fittedCurveMultiplier =
    1 +
    0.16 * Math.sin(baseSpinProgress * TAU - 0.45) +
    0.05 * Math.sin(baseSpinProgress * TAU * 2 + 0.8);
  const impactPulse = getGaussianPulse(
    getWrappedDistance(bounceProgress, IMPACT_PROGRESS),
    IMPACT_WIDTH,
  );
  const impactBoostMultiplier = 1 + 0.9 * (impactPulse - IMPACT_PULSE_MEAN);

  return clamp(fittedCurveMultiplier * impactBoostMultiplier, 0.72, 1.95);
}

export function interpolateBounce(progress: number): BounceState {
  const clampedProgress = clamp(progress, 0, 1);

  for (let index = 1; index < BOUNCE_KEYFRAMES.length; index += 1) {
    const previousKeyframe = BOUNCE_KEYFRAMES[index - 1];
    const nextKeyframe = BOUNCE_KEYFRAMES[index];

    if (clampedProgress <= nextKeyframe.t) {
      const segmentProgress =
        (clampedProgress - previousKeyframe.t) / (nextKeyframe.t - previousKeyframe.t);

      return {
        translateY:
          previousKeyframe.translateY +
          (nextKeyframe.translateY - previousKeyframe.translateY) * segmentProgress,
        scaleX:
          previousKeyframe.scaleX +
          (nextKeyframe.scaleX - previousKeyframe.scaleX) * segmentProgress,
        scaleY:
          previousKeyframe.scaleY +
          (nextKeyframe.scaleY - previousKeyframe.scaleY) * segmentProgress,
      };
    }
  }

  const lastKeyframe = BOUNCE_KEYFRAMES[BOUNCE_KEYFRAMES.length - 1];

  return {
    translateY: lastKeyframe.translateY,
    scaleX: lastKeyframe.scaleX,
    scaleY: lastKeyframe.scaleY,
  };
}

export function getEffectiveBounceDelayMs(animationConfig: AnimationConfig): number {
  return DEFAULT_BOUNCE_ALIGNMENT_OFFSET_MS + animationConfig.delay;
}

export function getBounceProgress(
  elapsedMs: number,
  bounceCycleDurationMs: number,
  animationConfig: AnimationConfig,
): number {
  return getCycleProgress(
    elapsedMs,
    bounceCycleDurationMs,
    getEffectiveBounceDelayMs(animationConfig),
  );
}

export function getInitialRotationFrameState(
  animationConfig: AnimationConfig,
): RotationFrameState {
  return getRotationFrameState(0, animationConfig.rotationMode);
}

function getRotationFrameState(
  angleRad: number,
  rotationMode: RotationMode,
): RotationFrameState {
  if (rotationMode === 'flat') {
    return {
      mode: rotationMode,
      angleRad,
      brightness: 1,
      saturation: 1,
      shadeOpacity: 0,
      highlightOpacity: 0,
      horizontalScale: 1,
    };
  }

  const cosine = Math.cos(angleRad);
  const absoluteCosine = Math.abs(cosine);
  const edgeFactor = 1 - absoluteCosine;
  const backFaceFactor = cosine < 0 ? 1 : 0;

  return {
    mode: rotationMode,
    angleRad,
    brightness: clamp(0.93 - edgeFactor * 0.26 - backFaceFactor * 0.12, 0.52, 1),
    saturation: clamp(1.03 - edgeFactor * 0.22, 0.74, 1.03),
    shadeOpacity: clamp(0.05 + edgeFactor * 0.24 + backFaceFactor * 0.08, 0.05, 0.42),
    highlightOpacity: clamp((1 - backFaceFactor) * (0.08 + edgeFactor * 0.12), 0, 0.22),
    horizontalScale: cosine,
  };
}

export function getAnimationFrameState(params: {
  readonly elapsedMs: number;
  readonly deltaMs: number;
  readonly bounceCycleDurationMs: number;
  readonly currentRotationAngleRad: number;
  readonly animationConfig: AnimationConfig;
}): AnimationFrameState {
  const {
    elapsedMs,
    deltaMs,
    bounceCycleDurationMs,
    currentRotationAngleRad,
    animationConfig,
  } = params;
  const bounceProgress = getBounceProgress(elapsedMs, bounceCycleDurationMs, animationConfig);
  const bounce = interpolateBounce(bounceProgress);
  const spinCycleDurationMs = animationConfig.spinSpeed * 1000;
  const baseSpinProgress = getCycleProgress(elapsedMs, spinCycleDurationMs, 0);
  const velocityMultiplier = getSpinVelocityMultiplier(
    baseSpinProgress,
    bounceProgress,
    animationConfig.rotationMode,
  );
  const nextRotationAngleRad =
    currentRotationAngleRad +
    (deltaMs / spinCycleDurationMs) * TAU * velocityMultiplier;

  return {
    bounce,
    bounceProgress,
    rotation: getRotationFrameState(nextRotationAngleRad, animationConfig.rotationMode),
    nextRotationAngleRad,
  };
}
