import { chromium } from 'playwright-core';
import { extractLinuxDoUserId } from '../../src/lib/linuxDo.js';

const USER_INPUT_MAX_LENGTH = 200;
const USER_AVATAR_SIZE = '288';
const AVATAR_TEMPLATE_PATTERN =
  /^\/user_avatar\/linux\.do\/([A-Za-z0-9._-]+)\/\{size\}\/([A-Za-z0-9._-]+\.(?:png|jpe?g|gif|webp))$/i;

interface LinuxDoUserJsonResponse {
  readonly user?: {
    readonly avatar_template?: string;
  };
}

interface ParsedAvatarTemplate {
  readonly userId: string;
  readonly fileName: string;
}

interface BrightCaptchaClient {
  send(
    method: 'Captcha.waitForSolve',
    params: {
      detectTimeout: number;
    },
  ): Promise<unknown>;
}

function isSameOrigin(input: string, requestUrl: URL): boolean {
  try {
    const parsedUrl = new URL(input);
    return parsedUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export function hasAllowedSiteContext(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin !== null) {
    return isSameOrigin(origin, requestUrl);
  }

  const referer = request.headers.get('referer');
  if (referer !== null) {
    return isSameOrigin(referer, requestUrl);
  }

  return false;
}

export function jsonResponse(
  payload: Record<string, string>,
  status = 200,
): Response {
  return Response.json(payload, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  });
}

export function readAndValidateInput(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const input = requestUrl.searchParams.get('input');

  if (input === null) {
    return null;
  }

  const trimmedInput = input.trim();
  if (trimmedInput.length === 0 || trimmedInput.length > USER_INPUT_MAX_LENGTH) {
    return null;
  }

  return trimmedInput;
}

export function readAndValidateUserId(input: string): string | null {
  return extractLinuxDoUserId(input);
}

export function parseAvatarTemplate(
  template: string,
  expectedUserId: string,
): ParsedAvatarTemplate | null {
  if (template.length === 0 || template.length > USER_INPUT_MAX_LENGTH) {
    return null;
  }

  const match = template.match(AVATAR_TEMPLATE_PATTERN);
  if (match === null) {
    return null;
  }

  const [, userId, fileName] = match;
  if (userId !== expectedUserId) {
    return null;
  }

  return {
    userId,
    fileName,
  };
}

export function buildAvatarProxyUrl(request: Request, userId: string, template: string): string {
  const requestUrl = new URL(request.url);
  const avatarUrl = new URL('/api/linuxdo-avatar', requestUrl.origin);
  avatarUrl.searchParams.set('userId', userId);
  avatarUrl.searchParams.set('template', template);

  return avatarUrl.pathname + avatarUrl.search;
}

export function buildLinuxDoCdnAvatarUrl(userId: string, fileName: string): string {
  return `https://cdn.linux.do/user_avatar/linux.do/${userId}/${USER_AVATAR_SIZE}/${fileName}`;
}

export async function fetchLinuxDoAvatarTemplateViaBrowser(
  userId: string,
): Promise<string> {
  const browserWs = process.env.BROWSER_WS;
  if (typeof browserWs !== 'string' || browserWs.trim().length === 0) {
    throw new Error('服务器未配置 Bright Browser API');
  }

  const browser = await chromium.connectOverCDP(browserWs, {
    timeout: 60_000,
  });

  try {
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = await context.newPage();

    try {
      const client = await page.context().newCDPSession(page);
      await page.goto(`https://linux.do/u/${encodeURIComponent(userId)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      try {
        await (client as unknown as BrightCaptchaClient).send('Captcha.waitForSolve', {
          detectTimeout: 10_000,
        });
      } catch {
        // Ignore unsupported or not detected captcha waits.
      }

      const userResponse = await page.evaluate(
        async (lookupUserId: string) => {
          const response = await fetch(`/u/${encodeURIComponent(lookupUserId)}.json`, {
            credentials: 'include',
            headers: {
              accept: 'application/json',
            },
          });

          return {
            status: response.status,
            contentType: response.headers.get('content-type'),
            text: await response.text(),
          };
        },
        userId,
      );

      if (userResponse.status === 404) {
        throw new Error('未找到该 linux.do 用户，请确认 id 是否正确');
      }

      if (
        userResponse.status !== 200 ||
        userResponse.contentType === null ||
        !userResponse.contentType.includes('application/json')
      ) {
        throw new Error('linux.do 当前触发了安全校验，请稍后重试');
      }

      const data = JSON.parse(userResponse.text) as LinuxDoUserJsonResponse;
      const avatarTemplate = data.user?.avatar_template;

      if (typeof avatarTemplate !== 'string' || avatarTemplate.length === 0) {
        throw new Error('该 linux.do 用户没有可用头像');
      }

      return avatarTemplate;
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
