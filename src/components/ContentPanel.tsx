import { Link2, Type, Upload } from 'lucide-react';
import { useCallback } from 'react';
import type { LinuxDoLookupStatus, TextConfig } from '../types';

interface ContentPanelProps {
  readonly textConfig: TextConfig;
  readonly showLinuxDoAvatarLookup: boolean;
  readonly linuxDoInput: string;
  readonly linuxDoLookupStatus: LinuxDoLookupStatus;
  readonly linuxDoLookupMessage: string | null;
  readonly onTextConfigChange: (update: Partial<TextConfig>) => void;
  readonly onLinuxDoInputChange: (value: string) => void;
  readonly onLinuxDoAvatarFetch: () => void;
  readonly onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContentPanel({
  textConfig,
  showLinuxDoAvatarLookup,
  linuxDoInput,
  linuxDoLookupStatus,
  linuxDoLookupMessage,
  onTextConfigChange,
  onLinuxDoInputChange,
  onLinuxDoAvatarFetch,
  onImageUpload,
}: ContentPanelProps) {
  const handleTextContentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onTextConfigChange({ content: event.target.value });
    },
    [onTextConfigChange],
  );

  const handleLinuxDoInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onLinuxDoInputChange(event.target.value);
    },
    [onLinuxDoInputChange],
  );

  const handleLinuxDoSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onLinuxDoAvatarFetch();
    },
    [onLinuxDoAvatarFetch],
  );

  const linuxDoMessageClassName =
    linuxDoLookupStatus === 'error'
      ? 'text-red-300 bg-red-500/10 border-red-500/30'
      : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 shadow-xl flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-neutral-100">内容设置</h2>
        <p className="text-sm text-neutral-400 mt-1">文案和头像素材放在这里。</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-neutral-300">
          <Type size={16} /> 底部文案
        </label>
        <input
          type="text"
          value={textConfig.content}
          onChange={handleTextContentChange}
          placeholder="快做啊！"
          maxLength={15}
          className="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-neutral-300">
          <Upload size={16} /> 上传陀螺头像 (建议正方形)
        </label>
        <label className="flex items-center justify-center w-full h-20 px-4 transition bg-neutral-900 border-2 border-neutral-600 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
          <span className="flex items-center space-x-2 text-neutral-400">
            <Upload size={20} />
            <span className="font-medium">点击选择图片...</span>
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onImageUpload}
          />
        </label>
      </div>

      {showLinuxDoAvatarLookup ? (
        <form
          className="rounded-xl border border-neutral-700/50 bg-neutral-900 p-4 space-y-3"
          onSubmit={handleLinuxDoSubmit}
        >
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-neutral-300">
              <Link2 size={16} /> 从 linux.do 获取头像
            </label>
            <input
              type="text"
              value={linuxDoInput}
              onChange={handleLinuxDoInputChange}
              placeholder="haleclipse 或 https://linux.do/u/haleclipse/summary"
              disabled={linuxDoLookupStatus === 'loading'}
              className="w-full bg-neutral-950 border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-400">
              支持输入用户 id，或粘贴用户主页地址自动识别。
            </p>
            <button
              type="submit"
              disabled={linuxDoLookupStatus === 'loading' || linuxDoInput.trim().length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/40"
            >
              {linuxDoLookupStatus === 'loading' ? '获取中...' : '获取头像'}
            </button>
          </div>

          {linuxDoLookupMessage === null ? null : (
            <div className={`rounded-lg border px-3 py-2 text-xs ${linuxDoMessageClassName}`}>
              {linuxDoLookupMessage}
            </div>
          )}
        </form>
      ) : null}
    </div>
  );
}
