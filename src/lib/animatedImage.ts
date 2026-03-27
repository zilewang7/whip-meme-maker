export interface DecodedImageFrame {
  readonly canvas: HTMLCanvasElement;
  readonly delayMs: number;
}

type FrameMapper<T> = (frame: VideoFrame) => T;

function getFrameDelayMs(durationUs: number | null): number {
  if (durationUs === null || durationUs <= 0) {
    return 50;
  }

  return Math.max(Math.round(durationUs / 1000), 20);
}

function getFrameCanvas(frame: VideoFrame): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = frame.displayWidth;
  canvas.height = frame.displayHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get background frame context');
  }

  context.drawImage(frame, 0, 0, canvas.width, canvas.height);

  return canvas;
}

async function createImageDecoder(src: string, mimeType: string): Promise<ImageDecoder> {
  if (typeof ImageDecoder === 'undefined') {
    throw new Error('当前浏览器不支持真实动图导出，请使用最新版 Chrome');
  }

  const isSupported = await ImageDecoder.isTypeSupported(mimeType);
  if (!isSupported) {
    throw new Error(`当前浏览器不支持 ${mimeType} 解码`);
  }

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`读取动图背景失败: ${response.status}`);
  }

  const data = await response.arrayBuffer();

  return new ImageDecoder({ data, type: mimeType });
}

async function mapAnimatedImageFrames<T>(
  decoder: ImageDecoder,
  mapFrame: FrameMapper<T>,
): Promise<T[]> {
  const frames: T[] = [];

  for (let frameIndex = 0; ; frameIndex += 1) {
    let decodedFrame: Awaited<ReturnType<ImageDecoder['decode']>>;

    try {
      decodedFrame = await decoder.decode({ frameIndex });
    } catch (error) {
      if (error instanceof RangeError) {
        break;
      }

      throw error;
    }

    try {
      frames.push(mapFrame(decodedFrame.image));
    } finally {
      decodedFrame.image.close();
    }
  }

  return frames;
}

export async function getAnimatedImageDurationMs(
  src: string,
  mimeType: string,
): Promise<number> {
  const decoder = await createImageDecoder(src, mimeType);

  try {
    const frameDurations = await mapAnimatedImageFrames(decoder, (frame) =>
      getFrameDelayMs(frame.duration),
    );

    if (frameDurations.length === 0) {
      throw new Error('动图背景没有可导出的帧');
    }

    return frameDurations.reduce((total, duration) => total + duration, 0);
  } finally {
    decoder.close();
  }
}

export async function decodeAnimatedImageFrames(
  src: string,
  mimeType: string,
): Promise<readonly DecodedImageFrame[]> {
  const decoder = await createImageDecoder(src, mimeType);

  try {
    const frames = await mapAnimatedImageFrames(decoder, (frame) => ({
      canvas: getFrameCanvas(frame),
      delayMs: getFrameDelayMs(frame.duration),
    }));

    if (frames.length === 0) {
      throw new Error('动图背景没有可导出的帧');
    }

    return frames;
  } finally {
    decoder.close();
  }
}
