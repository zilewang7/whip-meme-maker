import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
import type { AvatarConfig, TextConfig, AnimationConfig } from '../types';
import { BG_IMAGE_PATH, CANVAS_SIZE } from '../constants';
import {
  getAnimationFrameState,
  getEffectiveBounceDelayMs,
  getInitialRotationFrameState,
  type RotationFrameState,
} from '../lib/animation';

interface PreviewPanelProps {
  readonly avatarUrl: string | null;
  readonly avatarConfig: AvatarConfig;
  readonly textConfig: TextConfig;
  readonly animationConfig: AnimationConfig;
  readonly bounceDurationMs: number;
  readonly animKey: number;
  readonly isExporting: boolean;
  readonly exportProgress: number;
  readonly exportErrorMessage: string | null;
  readonly bgImgRef: React.RefObject<HTMLImageElement | null>;
  readonly onExport: () => void;
}

function getRoundedCornerRadius(size: number): string {
  return `${Math.max(Math.round(size * 0.22), 10)}px`;
}

function getRotationTransform(rotation: RotationFrameState): string {
  const angleDeg = (rotation.angleRad * 180) / Math.PI;

  if (rotation.mode === 'flat') {
    return `rotate(${angleDeg}deg)`;
  }

  return `perspective(780px) rotateY(${angleDeg}deg)`;
}

function getHighlightGradientDirection(horizontalScale: number): string {
  return horizontalScale >= 0 ? '90deg' : '270deg';
}

function getShadeGradientDirection(horizontalScale: number): string {
  return horizontalScale >= 0 ? '270deg' : '90deg';
}

export function PreviewPanel({
  avatarUrl,
  avatarConfig,
  textConfig,
  animationConfig,
  bounceDurationMs,
  animKey,
  isExporting,
  exportProgress,
  exportErrorMessage,
  bgImgRef,
  onExport,
}: PreviewPanelProps) {
  const [rotationFrameState, setRotationFrameState] = useState<RotationFrameState>(() =>
    getInitialRotationFrameState(animationConfig),
  );

  useEffect(() => {
    let animationFrameId = 0;
    let startTimeMs = performance.now();
    let previousTimeMs = startTimeMs;
    let currentRotationAngleRad = 0;

    const tick = (currentTimeMs: number): void => {
      const elapsedMs = currentTimeMs - startTimeMs;
      const deltaMs = currentTimeMs - previousTimeMs;
      previousTimeMs = currentTimeMs;

      const frameState = getAnimationFrameState({
        elapsedMs,
        deltaMs,
        bounceCycleDurationMs: bounceDurationMs,
        currentRotationAngleRad,
        animationConfig,
      });

      currentRotationAngleRad = frameState.nextRotationAngleRad;
      setRotationFrameState(frameState.rotation);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame((currentTimeMs) => {
      startTimeMs = currentTimeMs;
      previousTimeMs = currentTimeMs;
      tick(currentTimeMs);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [animKey, animationConfig, bounceDurationMs]);

  const effectiveBounceDelayMs = useMemo(
    () => getEffectiveBounceDelayMs(animationConfig),
    [animationConfig],
  );

  const avatarWrapperStyle = useMemo(
    () => ({
      left: `${avatarConfig.x}%`,
      top: `${avatarConfig.y}%`,
      width: `${avatarConfig.size}px`,
      height: `${avatarConfig.size}px`,
      transform: 'translate(-50%, -50%)',
    }),
    [avatarConfig.x, avatarConfig.y, avatarConfig.size],
  );

  const avatarShellStyle = useMemo<CSSProperties>(
    () => ({
      borderRadius:
        avatarConfig.shape === 'circle' ? '9999px' : getRoundedCornerRadius(avatarConfig.size),
      borderColor: avatarConfig.borderColor,
      transform: getRotationTransform(rotationFrameState),
      transformStyle: 'preserve-3d',
    }),
    [avatarConfig.borderColor, avatarConfig.shape, avatarConfig.size, rotationFrameState],
  );

  const avatarMediaStyle = useMemo(
    () => ({
      filter: `brightness(${rotationFrameState.brightness}) saturate(${rotationFrameState.saturation})`,
    }),
    [rotationFrameState.brightness, rotationFrameState.saturation],
  );

  const highlightOverlayStyle = useMemo(
    () => ({
      opacity: rotationFrameState.highlightOpacity,
      background: `linear-gradient(${getHighlightGradientDirection(
        rotationFrameState.horizontalScale,
      )}, rgba(255, 255, 255, 0.35), transparent 58%)`,
    }),
    [rotationFrameState.highlightOpacity, rotationFrameState.horizontalScale],
  );

  const shadeOverlayStyle = useMemo(
    () => ({
      opacity: rotationFrameState.shadeOpacity,
      background: `linear-gradient(${getShadeGradientDirection(
        rotationFrameState.horizontalScale,
      )}, rgba(0, 0, 0, 0.55), transparent 72%)`,
    }),
    [rotationFrameState.horizontalScale, rotationFrameState.shadeOpacity],
  );

  const bounceStyle = useMemo(
    () => ({
      animationName: 'whip-bounce',
      animationDuration: `${bounceDurationMs / 1000}s`,
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
      animationDelay: `${effectiveBounceDelayMs}ms`,
    }),
    [bounceDurationMs, effectiveBounceDelayMs],
  );

  const textWrapperStyle = useMemo(
    () => ({
      left: `${textConfig.x}%`,
      top: `${textConfig.y}%`,
      transform: 'translate(-50%, -50%)',
    }),
    [textConfig.x, textConfig.y],
  );

  const textStyle = useMemo(
    () => ({
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: `${textConfig.size}px`,
    }),
    [textConfig.size],
  );

  const canvasStyle = useMemo(
    () => ({ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }),
    [],
  );

  return (
    <div className="flex flex-col items-center justify-start bg-neutral-800 p-6 rounded-2xl border border-neutral-700 shadow-2xl">
      <div className="mb-4 w-full flex items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ImageIcon size={20} className="text-blue-400" />
          实时预览
        </h2>
      </div>

      <div
        className="relative rounded-xl overflow-hidden bg-white shadow-inner flex items-center justify-center"
        style={canvasStyle}
      >
        <img
          key={`bg-${animKey}`}
          ref={bgImgRef}
          src={BG_IMAGE_PATH}
          alt="Whipping Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div
          key={`avatar-wrap-${animKey}`}
          className="absolute"
          style={avatarWrapperStyle}
        >
          <div className="w-full h-full" style={bounceStyle}>
            <div
              className="relative w-full h-full overflow-hidden border-2 shadow-lg"
              style={avatarShellStyle}
            >
              <div className="absolute inset-0" style={avatarMediaStyle}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    crossOrigin={avatarUrl.startsWith('http') ? 'anonymous' : undefined}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    传头像
                  </div>
                )}
              </div>
              {rotationFrameState.mode === 'vertical-3d' ? (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={highlightOverlayStyle} />
                  <div className="absolute inset-0 pointer-events-none" style={shadeOverlayStyle} />
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="absolute whitespace-nowrap" style={textWrapperStyle}>
          <p
            className="font-black text-black text-outline tracking-wider"
            style={textStyle}
          >
            {textConfig.content || ' '}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 w-full max-w-[300px]">
        <button
          onClick={onExport}
          disabled={isExporting}
          className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
            isExporting
              ? 'bg-red-500/20 text-red-500 cursor-not-allowed animate-pulse border border-red-500/50'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white hover:shadow-blue-500/25 border border-transparent'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1" />
              导出中 {exportProgress}%
            </>
          ) : (
            <>
              <Video size={18} />
              导出 GIF 动图
            </>
          )}
        </button>
        <div className="text-xs text-neutral-400 bg-neutral-900/50 p-3 rounded-lg leading-relaxed text-center">
          点击导出后会自动生成并下载 GIF 动图文件，可直接发给朋友。
        </div>
        {exportErrorMessage === null ? null : (
          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 p-3 rounded-lg leading-relaxed text-center">
            {exportErrorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
