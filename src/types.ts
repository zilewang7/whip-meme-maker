export type AvatarShape = 'circle' | 'rounded-square';
export type RotationMode = 'flat' | 'vertical-3d';

export interface AvatarConfig {
  readonly size: number;
  readonly x: number;
  readonly y: number;
  readonly shape: AvatarShape;
  readonly borderColor: string;
}

export interface TextConfig {
  readonly content: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

export interface AnimationConfig {
  readonly spinSpeed: number;
  readonly delay: number;
  readonly rotationMode: RotationMode;
}
