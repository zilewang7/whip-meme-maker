import { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import type { AvatarConfig, TextConfig, AnimationConfig } from './types';
import {
  BG_IMAGE_MIME_TYPE,
  BG_IMAGE_PATH,
  DEFAULT_PREVIEW_CYCLE_DURATION_MS,
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_TEXT_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  MIN_PREVIEW_CYCLE_DURATION_MS,
} from './constants';
import { ContentPanel } from './components/ContentPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ControlPanel } from './components/ControlPanel';
import { useGifExport } from './hooks/useGifExport';
import { getAnimatedImageDurationMs } from './lib/animatedImage';

export function App() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [textConfig, setTextConfig] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>(DEFAULT_ANIMATION_CONFIG);
  const [animKey, setAnimKey] = useState(0);
  const [previewCycleDurationMs, setPreviewCycleDurationMs] = useState(
    DEFAULT_PREVIEW_CYCLE_DURATION_MS,
  );

  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const avatarUrlRef = useRef<string | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (avatarUrlRef.current) {
        URL.revokeObjectURL(avatarUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getAnimatedImageDurationMs(BG_IMAGE_PATH, BG_IMAGE_MIME_TYPE)
      .then((durationMs) => {
        if (cancelled) {
          return;
        }

        setPreviewCycleDurationMs(
          Math.max(durationMs, MIN_PREVIEW_CYCLE_DURATION_MS),
        );
      })
      .catch((error: unknown) => {
        console.error('Failed to read background animation duration:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAnimKey((prev) => prev + 1);
    }, previewCycleDurationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [previewCycleDurationMs]);

  const { isExporting, progress, errorMessage, exportGif } = useGifExport({
    bgImgRef,
    avatarUrl,
    avatarConfig,
    textConfig,
    animationConfig,
  });

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (avatarUrlRef.current) {
        URL.revokeObjectURL(avatarUrlRef.current);
      }
      const newUrl = URL.createObjectURL(file);
      avatarUrlRef.current = newUrl;
      setAvatarUrl(newUrl);
    },
    [],
  );

  const handleAvatarConfigChange = useCallback(
    (update: Partial<AvatarConfig>) => {
      setAvatarConfig((prev) => ({ ...prev, ...update }));
    },
    [],
  );

  const handleTextConfigChange = useCallback(
    (update: Partial<TextConfig>) => {
      setTextConfig((prev) => ({ ...prev, ...update }));
    },
    [],
  );

  const handleAnimationConfigChange = useCallback(
    (update: Partial<AnimationConfig>) => {
      setAnimationConfig((prev) => ({ ...prev, ...update }));
      setAnimKey((prev) => prev + 1);
    },
    [],
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center justify-center gap-3 tracking-wider text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
            <RefreshCw className="text-blue-400 animate-spin-slow" size={32} />
            鞭策动图生成器
          </h1>
          <p className="text-neutral-400">
            上传头像，输入文字，生成专属催更/鞭策动图
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-8">
            <PreviewPanel
              avatarUrl={avatarUrl}
              avatarConfig={avatarConfig}
              textConfig={textConfig}
              animationConfig={animationConfig}
              bounceDurationMs={previewCycleDurationMs}
              animKey={animKey}
              isExporting={isExporting}
              exportProgress={progress}
              exportErrorMessage={errorMessage}
              bgImgRef={bgImgRef}
              onExport={exportGif}
            />

            <ContentPanel
              textConfig={textConfig}
              onTextConfigChange={handleTextConfigChange}
              onImageUpload={handleImageUpload}
            />
          </div>

          <ControlPanel
            avatarConfig={avatarConfig}
            textConfig={textConfig}
            animationConfig={animationConfig}
            onAvatarConfigChange={handleAvatarConfigChange}
            onTextConfigChange={handleTextConfigChange}
            onAnimationConfigChange={handleAnimationConfigChange}
          />
        </div>

        <footer className="mt-10 text-center text-sm text-neutral-500">
          <span>灵感来自 </span>
          <a
            href="https://linux.do/"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-300 hover:text-blue-300 transition-colors"
          >
            linux.do
          </a>
          <span> 被鞭策的 </span>
          <a
            href="https://linux.do/u/haleclipse/summary"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-300 hover:text-blue-300 transition-colors"
          >
            哈雷佬
          </a>
        </footer>
      </div>
    </div>
  );
}
