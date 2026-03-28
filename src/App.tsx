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
import { extractLinuxDoUserId, fetchLinuxDoAvatar } from './lib/linuxDo';
import type { LinuxDoLookupStatus } from './types';

function GitHubMarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 fill-current"
    >
      <path d="M12 .297C5.372.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.387.6.11.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.236-3.22-.123-.303-.536-1.523.117-3.176 0 0 1.008-.323 3.301 1.23a11.49 11.49 0 0 1 3.006-.404c1.02.004 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.655 1.653.242 2.873.119 3.176.77.838 1.234 1.91 1.234 3.22 0 4.61-2.807 5.624-5.48 5.922.43.372.814 1.102.814 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297Z" />
    </svg>
  );
}

export function App() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [textConfig, setTextConfig] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>(DEFAULT_ANIMATION_CONFIG);
  const [showLinuxDoAvatarLookup, setShowLinuxDoAvatarLookup] = useState(false);
  const [linuxDoInput, setLinuxDoInput] = useState('');
  const [linuxDoLookupStatus, setLinuxDoLookupStatus] = useState<LinuxDoLookupStatus>('idle');
  const [linuxDoLookupMessage, setLinuxDoLookupMessage] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [previewCycleDurationMs, setPreviewCycleDurationMs] = useState(
    DEFAULT_PREVIEW_CYCLE_DURATION_MS,
  );

  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const avatarUrlRef = useRef<string | null>(null);

  const clearObjectAvatarUrl = useCallback(() => {
    if (avatarUrlRef.current !== null) {
      URL.revokeObjectURL(avatarUrlRef.current);
      avatarUrlRef.current = null;
    }
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      clearObjectAvatarUrl();
    };
  }, [clearObjectAvatarUrl]);

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
    let ignore = false;

    async function fetchLinuxDoStatus(): Promise<void> {
      try {
        const response = await fetch('/api/linuxdo-status');
        if (!response.ok) {
          if (!ignore) {
            setShowLinuxDoAvatarLookup(false);
          }
          return;
        }

        const data = (await response.json()) as { enabled?: boolean };
        if (!ignore) {
          setShowLinuxDoAvatarLookup(data.enabled === true);
        }
      } catch {
        if (!ignore) {
          setShowLinuxDoAvatarLookup(false);
        }
      }
    }

    void fetchLinuxDoStatus();

    return () => {
      ignore = true;
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

      clearObjectAvatarUrl();
      const newUrl = URL.createObjectURL(file);
      avatarUrlRef.current = newUrl;
      setAvatarUrl(newUrl);
      setLinuxDoLookupStatus('idle');
      setLinuxDoLookupMessage(null);
    },
    [clearObjectAvatarUrl],
  );

  const handleLinuxDoInputChange = useCallback((value: string) => {
    setLinuxDoInput(value);
    setLinuxDoLookupStatus('idle');
    setLinuxDoLookupMessage(null);
  }, []);

  const handleLinuxDoAvatarFetch = useCallback(async () => {
    const userId = extractLinuxDoUserId(linuxDoInput);

    if (userId === null) {
      setLinuxDoLookupStatus('error');
      setLinuxDoLookupMessage('请输入 linux.do 用户 id，或合法的用户主页地址');
      return;
    }

    setLinuxDoLookupStatus('loading');
    setLinuxDoLookupMessage(null);

    try {
      const result = await fetchLinuxDoAvatar(userId);
      clearObjectAvatarUrl();
      setAvatarUrl(result.avatarUrl);
      setLinuxDoInput(result.userId);
      setLinuxDoLookupStatus('success');
      setLinuxDoLookupMessage(`已获取 @${result.userId} 的头像`);
    } catch (error) {
      const message = (() => {
        if (error instanceof TypeError) {
          return '获取 linux.do 头像失败，请检查网络连接、站点可访问性或浏览器跨域限制';
        }

        if (error instanceof Error) {
          return error.message;
        }

        return '获取 linux.do 头像失败，请检查网络、用户 id 或稍后重试';
      })();
      setLinuxDoLookupStatus('error');
      setLinuxDoLookupMessage(message);
    }
  }, [clearObjectAvatarUrl, linuxDoInput]);

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
        <div className="relative mb-8">
          <a
            href="https://github.com/zilewang7/whip-meme-maker"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub 仓库"
            title="GitHub 仓库"
            className="absolute top-0 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800/80 text-neutral-300 shadow-lg shadow-black/10 transition-colors hover:border-neutral-500 hover:bg-neutral-700/80 hover:text-white"
          >
            <GitHubMarkIcon />
            <span className="sr-only">GitHub 仓库</span>
          </a>

          <div className="text-center px-16 sm:px-0">
            <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center justify-center gap-3 tracking-wider text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
              <RefreshCw className="text-blue-400 animate-spin-slow" size={32} />
              鞭策动图生成器
            </h1>
            <p className="text-neutral-400">
              上传头像，输入文字，生成专属催更/鞭策动图
            </p>
          </div>
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
              showLinuxDoAvatarLookup={showLinuxDoAvatarLookup}
              linuxDoInput={linuxDoInput}
              linuxDoLookupStatus={linuxDoLookupStatus}
              linuxDoLookupMessage={linuxDoLookupMessage}
              onTextConfigChange={handleTextConfigChange}
              onLinuxDoInputChange={handleLinuxDoInputChange}
              onLinuxDoAvatarFetch={handleLinuxDoAvatarFetch}
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
