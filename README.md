# Whip GIF Studio

一个浏览器内运行的鞭策动图生成器。

上传头像、输入文案、调整位置与动画参数后，可以直接导出 GIF

## 功能

- 支持上传头像并叠加到鞭策动图背景
- 支持文案位置、头像位置、大小调节
- 支持圆形 / 圆角方形头像
- 支持边框颜色配置
- 支持平面旋转 / 纵向 3D 旋转
- 导出 GIF 文件

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- gifenc
- WebCodecs `ImageDecoder`

## 本地运行

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

## 校验

```bash
pnpm lint
npx tsc -b --noEmit
```

## 说明

- 导出 GIF 依赖浏览器对 `ImageDecoder` 的支持，建议使用较新的 Chromium 浏览器。
