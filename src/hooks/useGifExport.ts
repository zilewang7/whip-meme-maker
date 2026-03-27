import { useCallback, useRef, useState } from 'react';
import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { AvatarConfig, TextConfig, AnimationConfig } from '../types';
import { BG_IMAGE_MIME_TYPE, BG_IMAGE_PATH, CANVAS_SIZE } from '../constants';
import { getAnimationFrameState } from '../lib/animation';
import { decodeAnimatedImageFrames } from '../lib/animatedImage';
import { loadImage } from '../lib/canvas';
import { renderScene } from '../lib/renderScene';

export interface UseGifExportParams {
  bgImgRef: React.RefObject<HTMLImageElement | null>;
  avatarUrl: string | null;
  avatarConfig: AvatarConfig;
  textConfig: TextConfig;
  animationConfig: AnimationConfig;
}

export function useGifExport(params: UseGifExportParams) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const exportGif = useCallback(async () => {
    const { bgImgRef, avatarUrl, avatarConfig, textConfig, animationConfig } = paramsRef.current;
    const bgImg = bgImgRef.current;
    if (!bgImg || !bgImg.complete || bgImg.naturalWidth === 0) return;

    setIsExporting(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const [avatarImage, backgroundFrames] = await Promise.all([
        avatarUrl === null ? Promise.resolve(null) : loadImage(avatarUrl),
        decodeAnimatedImageFrames(BG_IMAGE_PATH, BG_IMAGE_MIME_TYPE),
      ]);

      if (backgroundFrames.length === 0) {
        throw new Error('动图背景没有解码出任何帧');
      }

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('无法创建导出画布');
      }

      const gif = GIFEncoder();
      const bounceDurationMs = backgroundFrames.reduce(
        (totalDuration, frame) => totalDuration + frame.delayMs,
        0,
      );

      let elapsedMs = 0;
      let currentRotationAngleRad = 0;
      let previousFrameDelayMs = 0;

      for (const [frameIndex, backgroundFrame] of backgroundFrames.entries()) {
        const animationState = getAnimationFrameState({
          elapsedMs,
          deltaMs: previousFrameDelayMs,
          bounceCycleDurationMs: bounceDurationMs,
          currentRotationAngleRad,
          animationConfig,
        });
        currentRotationAngleRad = animationState.nextRotationAngleRad;

        renderScene({
          canvasSize: CANVAS_SIZE,
          context,
          backgroundSource: backgroundFrame.canvas,
          avatarImage,
          avatarConfig,
          textConfig,
          bounceState: animationState.bounce,
          rotation: animationState.rotation,
        });

        const imageData = context.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const palette = quantize(imageData.data, 256);
        const indexedPixels = applyPalette(imageData.data, palette);

        gif.writeFrame(indexedPixels, CANVAS_SIZE, CANVAS_SIZE, {
          palette,
          delay: backgroundFrame.delayMs,
          repeat: frameIndex === 0 ? 0 : undefined,
        });

        elapsedMs += backgroundFrame.delayMs;
        previousFrameDelayMs = backgroundFrame.delayMs;
        setProgress(Math.round(((frameIndex + 1) / backgroundFrames.length) * 100));
      }

      gif.finish();
      const output = gif.bytes();
      const blob = new Blob([output], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'whip-meme.gif';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('GIF export failed:', err);
      setErrorMessage(err instanceof Error ? err.message : '导出 GIF 失败');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  return { isExporting, progress, errorMessage, exportGif };
}
