import { Type, Upload } from 'lucide-react';
import { useCallback } from 'react';
import type { TextConfig } from '../types';

interface ContentPanelProps {
  readonly textConfig: TextConfig;
  readonly onTextConfigChange: (update: Partial<TextConfig>) => void;
  readonly onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContentPanel({
  textConfig,
  onTextConfigChange,
  onImageUpload,
}: ContentPanelProps) {
  const handleTextContentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onTextConfigChange({ content: event.target.value });
    },
    [onTextConfigChange],
  );

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
    </div>
  );
}
