export type DrawableSource = HTMLCanvasElement | HTMLImageElement;

function getDrawableSize(source: DrawableSource): { width: number; height: number } {
  if (source instanceof HTMLCanvasElement) {
    return {
      width: source.width,
      height: source.height,
    };
  }

  return {
    width: source.naturalWidth,
    height: source.naturalHeight,
  };
}

export function drawImageCover(
  context: CanvasRenderingContext2D,
  source: DrawableSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const { width, height } = getDrawableSize(source);
  const sourceRatio = width / height;
  const targetRatio = dw / dh;

  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  if (sourceRatio > targetRatio) {
    sw = height * targetRatio;
    sx = (width - sw) / 2;
  } else {
    sh = width / targetRatio;
    sy = (height - sh) / 2;
  }

  context.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}
