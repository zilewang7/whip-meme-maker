import type { AvatarConfig, AvatarShape, TextConfig } from '../types';
import type { DrawableSource } from './canvas';
import { drawImageCover } from './canvas';
import type { BounceState, RotationFrameState } from './animation';

interface AvatarPlacement {
  readonly centerX: number;
  readonly centerY: number;
  readonly size: number;
  readonly shape: AvatarShape;
  readonly borderColor: string;
}

function getAvatarPlacement(canvasSize: number, avatarConfig: AvatarConfig): AvatarPlacement {
  return {
    centerX: (avatarConfig.x / 100) * canvasSize,
    centerY: (avatarConfig.y / 100) * canvasSize,
    size: avatarConfig.size,
    shape: avatarConfig.shape,
    borderColor: avatarConfig.borderColor,
  };
}

function getRoundedSquareRadius(size: number): number {
  return Math.max(Math.round(size * 0.22), 10);
}

function buildAvatarPath(
  context: CanvasRenderingContext2D,
  shape: AvatarShape,
  size: number,
): void {
  const radius = size / 2;

  context.beginPath();

  if (shape === 'circle') {
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.closePath();
    return;
  }

  const cornerRadius = Math.min(getRoundedSquareRadius(size), radius);
  const left = -radius;
  const top = -radius;
  const right = radius;
  const bottom = radius;

  context.moveTo(left + cornerRadius, top);
  context.lineTo(right - cornerRadius, top);
  context.quadraticCurveTo(right, top, right, top + cornerRadius);
  context.lineTo(right, bottom - cornerRadius);
  context.quadraticCurveTo(right, bottom, right - cornerRadius, bottom);
  context.lineTo(left + cornerRadius, bottom);
  context.quadraticCurveTo(left, bottom, left, bottom - cornerRadius);
  context.lineTo(left, top + cornerRadius);
  context.quadraticCurveTo(left, top, left + cornerRadius, top);
  context.closePath();
}

function drawAvatarFallback(context: CanvasRenderingContext2D, size: number): void {
  const radius = size / 2;
  const gradient = context.createLinearGradient(-radius, -radius, radius, radius);
  gradient.addColorStop(0, '#60a5fa');
  gradient.addColorStop(1, '#a855f7');

  context.fillStyle = gradient;
  context.fillRect(-radius, -radius, size, size);
  context.fillStyle = '#ffffff';
  context.font = `bold ${Math.round(size / 5)}px system-ui`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('传头像', 0, 0);
}

function applyRotationTransform(
  context: CanvasRenderingContext2D,
  rotation: RotationFrameState,
): void {
  if (rotation.mode === 'flat') {
    context.rotate(rotation.angleRad);
    return;
  }

  const horizontalScale =
    Math.abs(rotation.horizontalScale) < 0.04
      ? Math.sign(rotation.horizontalScale || 1) * 0.04
      : rotation.horizontalScale;
  context.scale(horizontalScale, 1);
}

function drawAvatarLighting(
  context: CanvasRenderingContext2D,
  placement: AvatarPlacement,
  rotation: RotationFrameState,
): void {
  if (rotation.mode === 'flat') {
    return;
  }

  const radius = placement.size / 2;
  const highlightStartX = rotation.horizontalScale >= 0 ? -radius : radius;
  const highlightEndX = rotation.horizontalScale >= 0 ? radius : -radius;
  const shadeStartX = rotation.horizontalScale >= 0 ? radius : -radius;
  const shadeEndX = rotation.horizontalScale >= 0 ? -radius : radius;

  const highlightGradient = context.createLinearGradient(
    highlightStartX,
    0,
    highlightEndX,
    0,
  );
  highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${rotation.highlightOpacity})`);
  highlightGradient.addColorStop(0.58, 'rgba(255, 255, 255, 0)');

  context.fillStyle = highlightGradient;
  context.fillRect(-radius, -radius, placement.size, placement.size);

  const shadeGradient = context.createLinearGradient(shadeStartX, 0, shadeEndX, 0);
  shadeGradient.addColorStop(0, `rgba(0, 0, 0, ${rotation.shadeOpacity})`);
  shadeGradient.addColorStop(0.72, 'rgba(0, 0, 0, 0)');

  context.fillStyle = shadeGradient;
  context.fillRect(-radius, -radius, placement.size, placement.size);
}

function drawAvatar(
  context: CanvasRenderingContext2D,
  avatarImage: HTMLImageElement | null,
  placement: AvatarPlacement,
  bounceState: BounceState,
  rotation: RotationFrameState,
): void {
  const radius = placement.size / 2;
  const bouncedCenterY = placement.centerY + bounceState.translateY * placement.size;

  context.save();
  context.translate(placement.centerX, bouncedCenterY);
  context.scale(bounceState.scaleX, bounceState.scaleY);
  applyRotationTransform(context, rotation);

  context.save();
  buildAvatarPath(context, placement.shape, placement.size);
  context.clip();
  context.filter = `brightness(${rotation.brightness}) saturate(${rotation.saturation})`;

  if (avatarImage === null) {
    drawAvatarFallback(context, placement.size);
  } else {
    context.drawImage(
      avatarImage,
      -radius,
      -radius,
      placement.size,
      placement.size,
    );
  }

  context.filter = 'none';
  drawAvatarLighting(context, placement, rotation);
  context.restore();

  buildAvatarPath(context, placement.shape, placement.size);
  context.strokeStyle = placement.borderColor;
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function drawText(
  context: CanvasRenderingContext2D,
  canvasSize: number,
  textConfig: TextConfig,
): void {
  if (textConfig.content.trim() === '') {
    return;
  }

  const textX = (textConfig.x / 100) * canvasSize;
  const textY = (textConfig.y / 100) * canvasSize;

  context.save();
  context.font = `900 ${textConfig.size}px system-ui, -apple-system, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.strokeStyle = '#ffffff';
  context.lineWidth = 4;
  context.lineJoin = 'round';
  context.strokeText(textConfig.content, textX, textY);
  context.fillStyle = '#000000';
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowOffsetY = 3;
  context.shadowBlur = 5;
  context.fillText(textConfig.content, textX, textY);
  context.restore();
}

export interface RenderSceneParams {
  readonly canvasSize: number;
  readonly context: CanvasRenderingContext2D;
  readonly backgroundSource: DrawableSource;
  readonly avatarImage: HTMLImageElement | null;
  readonly avatarConfig: AvatarConfig;
  readonly textConfig: TextConfig;
  readonly bounceState: BounceState;
  readonly rotation: RotationFrameState;
}

export function renderScene(params: RenderSceneParams): void {
  const {
    canvasSize,
    context,
    backgroundSource,
    avatarImage,
    avatarConfig,
    textConfig,
    bounceState,
    rotation,
  } = params;

  context.clearRect(0, 0, canvasSize, canvasSize);
  drawImageCover(context, backgroundSource, 0, 0, canvasSize, canvasSize);
  drawAvatar(
    context,
    avatarImage,
    getAvatarPlacement(canvasSize, avatarConfig),
    bounceState,
    rotation,
  );
  drawText(context, canvasSize, textConfig);
}
