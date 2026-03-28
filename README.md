# whip-meme-maker

一个浏览器内运行的鞭策动图生成器。

上传头像、输入文案、调整位置与动画参数后，可以直接导出 GIF

## 功能

- 支持上传头像并叠加到鞭策动图背景
- 支持文案位置、头像位置、大小调节
- 支持圆形 / 圆角方形头像
- 支持边框颜色配置
- 支持平面旋转 / 纵向 3D 旋转
- 支持输入 linux.do 用户 id / 粘贴用户主页地址获取头像
- 导出 GIF 文件

## 技术栈

- React 19
- TypeScript
- Vite
- Vercel Functions
- Bright Data Browser API
- Tailwind CSS v4
- gifenc
- WebCodecs `ImageDecoder`
- playwright-core

## 本地运行

```bash
pnpm install
pnpm build
```

### 纯前端预览

```bash
pnpm dev
```

### 带 linux.do 头像获取的本地调试

```bash
vercel login
vercel link
vercel env add BROWSER_WS development
vercel dev
```

> `linux.do` 头像抓取依赖 Vercel Functions + Bright Browser API。  
> 本地调试这部分功能时，请先安装 `vercel-cli`，并把 `BROWSER_WS` 配到 Vercel 项目的 `development` 环境变量里。

## 环境变量

当前需要的环境变量：

- `BROWSER_WS`: Bright Browser API 的 websocket 地址

建议统一通过 Vercel 管理，而不是提交任何 `.env` 模板文件。

本地调试可用：

```bash
vercel env add BROWSER_WS development
vercel dev
```

## 部署

推荐部署到 Vercel。

线上部署时，也需要在 Vercel 项目环境变量里配置同名变量：

- `BROWSER_WS`

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
- `linux.do` 头像获取通过 Vercel Functions 调用 Bright Browser API，在服务端浏览器上下文中请求 linux.do 用户 JSON。
- 头像图片也通过同源 API 中转，避免前端 canvas 导出时出现跨域污染。
- 如果未配置 `BROWSER_WS`，页面会自动隐藏 linux.do 头像获取入口。
- `vercel.json` 中配置了 SPA 回退规则和函数超时。
