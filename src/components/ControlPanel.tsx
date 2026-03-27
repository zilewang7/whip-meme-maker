import { useCallback, useMemo } from 'react';
import { Settings2 } from 'lucide-react';
import type {
  AvatarConfig,
  AvatarShape,
  RotationMode,
  TextConfig,
  AnimationConfig,
} from '../types';

interface ControlPanelProps {
  readonly avatarConfig: AvatarConfig;
  readonly textConfig: TextConfig;
  readonly animationConfig: AnimationConfig;
  readonly onAvatarConfigChange: (update: Partial<AvatarConfig>) => void;
  readonly onTextConfigChange: (update: Partial<TextConfig>) => void;
  readonly onAnimationConfigChange: (update: Partial<AnimationConfig>) => void;
}

interface ShapeOption {
  readonly label: string;
  readonly value: AvatarShape;
}

const SHAPE_OPTIONS: readonly ShapeOption[] = [
  { label: '圆形', value: 'circle' },
  { label: '圆角方形', value: 'rounded-square' },
];

interface RotationModeOption {
  readonly label: string;
  readonly value: RotationMode;
}

const ROTATION_MODE_OPTIONS: readonly RotationModeOption[] = [
  { label: '平面旋转', value: 'flat' },
  { label: '纵向 3D', value: 'vertical-3d' },
];

function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  accent = 'blue',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  accent?: 'blue' | 'purple' | 'green';
  onChange: (value: number) => void;
}) {
  const accentClass = useMemo(() => {
    const map = {
      blue: 'accent-blue-500',
      purple: 'accent-purple-500',
      green: 'accent-green-500',
    };
    return map[accent];
  }, [accent]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div>
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className={`w-full ${accentClass}`}
      />
    </div>
  );
}

export function ControlPanel({
  avatarConfig,
  textConfig,
  animationConfig,
  onAvatarConfigChange,
  onTextConfigChange,
  onAnimationConfigChange,
}: ControlPanelProps) {
  // Avatar config handlers
  const handleAvatarX = useCallback(
    (v: number) => onAvatarConfigChange({ x: v }),
    [onAvatarConfigChange],
  );
  const handleAvatarY = useCallback(
    (v: number) => onAvatarConfigChange({ y: v }),
    [onAvatarConfigChange],
  );
  const handleAvatarSize = useCallback(
    (v: number) => onAvatarConfigChange({ size: v }),
    [onAvatarConfigChange],
  );
  const handleAvatarShape = useCallback(
    (shape: AvatarShape) => onAvatarConfigChange({ shape }),
    [onAvatarConfigChange],
  );
  const handleBorderColorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onAvatarConfigChange({ borderColor: event.target.value });
    },
    [onAvatarConfigChange],
  );

  // Text config handlers
  const handleTextX = useCallback(
    (v: number) => onTextConfigChange({ x: v }),
    [onTextConfigChange],
  );
  const handleTextY = useCallback(
    (v: number) => onTextConfigChange({ y: v }),
    [onTextConfigChange],
  );
  const handleTextSize = useCallback(
    (v: number) => onTextConfigChange({ size: v }),
    [onTextConfigChange],
  );

  // Animation config handlers
  const handleSpinSpeed = useCallback(
    (v: number) => onAnimationConfigChange({ spinSpeed: v }),
    [onAnimationConfigChange],
  );
  const handleDelay = useCallback(
    (v: number) => onAnimationConfigChange({ delay: v }),
    [onAnimationConfigChange],
  );
  const handleRotationMode = useCallback(
    (rotationMode: RotationMode) => onAnimationConfigChange({ rotationMode }),
    [onAnimationConfigChange],
  );

  return (
    <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 shadow-xl flex flex-col gap-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
        <Settings2 size={20} className="text-purple-400" />
        调节参数
      </h2>

      {/* Avatar position & size */}
      <div className="space-y-4 bg-neutral-900 p-4 rounded-xl border border-neutral-700/50">
        <h3 className="text-sm font-bold text-neutral-400 mb-4">头像调节</h3>
        <div className="grid grid-cols-2 gap-4">
          <RangeSlider
            label={`水平位置 (X: ${avatarConfig.x}%)`}
            value={avatarConfig.x}
            min={0}
            max={100}
            onChange={handleAvatarX}
          />
          <RangeSlider
            label={`垂直位置 (Y: ${avatarConfig.y}%)`}
            value={avatarConfig.y}
            min={0}
            max={100}
            onChange={handleAvatarY}
          />
        </div>
        <RangeSlider
          label={`头像大小 (${avatarConfig.size}px)`}
          value={avatarConfig.size}
          min={30}
          max={150}
          accent="purple"
          onChange={handleAvatarSize}
        />
        <div>
          <p className="block text-xs text-neutral-400 mb-2">头像形状</p>
          <div className="grid grid-cols-2 gap-3">
            {SHAPE_OPTIONS.map((option) => {
              const isActive = avatarConfig.shape === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAvatarShape(option.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-400 bg-blue-500/15 text-blue-200'
                      : 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-2">边框颜色</label>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2">
            <input
              type="color"
              value={avatarConfig.borderColor}
              onChange={handleBorderColorChange}
              className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="text-sm font-mono text-neutral-300">{avatarConfig.borderColor}</span>
          </div>
        </div>
      </div>

      {/* Text position & size */}
      <div className="space-y-4 bg-neutral-900 p-4 rounded-xl border border-neutral-700/50">
        <h3 className="text-sm font-bold text-neutral-400 mb-4">文案调节</h3>
        <div className="grid grid-cols-2 gap-4">
          <RangeSlider
            label={`水平位置 (X: ${textConfig.x}%)`}
            value={textConfig.x}
            min={0}
            max={100}
            onChange={handleTextX}
          />
          <RangeSlider
            label={`垂直位置 (Y: ${textConfig.y}%)`}
            value={textConfig.y}
            min={0}
            max={100}
            onChange={handleTextY}
          />
        </div>
        <RangeSlider
          label={`文字大小 (${textConfig.size}px)`}
          value={textConfig.size}
          min={10}
          max={80}
          accent="purple"
          onChange={handleTextSize}
        />
      </div>

      {/* Animation tuning */}
      <div className="space-y-4 bg-neutral-900 p-4 rounded-xl border border-neutral-700/50">
        <h3 className="text-sm font-bold text-neutral-400 mb-2">
          动画微调 (匹配鞭打节奏)
        </h3>
        <RangeSlider
          label={`旋转速度 (${animationConfig.spinSpeed}s)`}
          value={animationConfig.spinSpeed}
          min={0.1}
          max={2}
          step={0.1}
          accent="green"
          onChange={handleSpinSpeed}
        />
        <RangeSlider
          label={`弹跳延迟/相位 (${animationConfig.delay}ms)`}
          value={animationConfig.delay}
          min={-1000}
          max={1000}
          step={50}
          accent="green"
          onChange={handleDelay}
        />
        <p className="text-xs text-green-400 -mt-5">用来对准落鞭瞬间</p>
        <div>
          <p className="block text-xs text-neutral-400 mb-2">旋转模式</p>
          <div className="grid grid-cols-2 gap-3">
            {ROTATION_MODE_OPTIONS.map((option) => {
              const isActive = animationConfig.rotationMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRotationMode(option.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                      : 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
