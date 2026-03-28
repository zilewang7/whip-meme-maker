const LINUX_DO_HOSTS = new Set(['linux.do', 'www.linux.do']);
const USER_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const LINUX_DO_LOOKUP_ENDPOINT = '/api/linuxdo-user';

export interface LinuxDoAvatarResult {
  readonly userId: string;
  readonly avatarUrl: string;
}

function extractUserIdFromPath(pathname: string): string | null {
  const segments = pathname
    .split('/')
    .map((segment) => decodeURIComponent(segment).trim())
    .filter((segment) => segment.length > 0);

  if (segments.length < 2 || segments[0] !== 'u') {
    return null;
  }

  return USER_ID_PATTERN.test(segments[1]) ? segments[1] : null;
}

function parseLinuxDoUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function normalizeInputToUrl(input: string): URL | null {
  const directUrl = parseLinuxDoUrl(input);
  if (directUrl !== null) {
    return directUrl;
  }

  if (input.startsWith('linux.do/') || input.startsWith('www.linux.do/')) {
    return parseLinuxDoUrl(`https://${input}`);
  }

  if (input.startsWith('/u/')) {
    return parseLinuxDoUrl(`https://linux.do${input}`);
  }

  return null;
}

export function extractLinuxDoUserId(input: string): string | null {
  const trimmedInput = input.trim();
  if (trimmedInput.length === 0) {
    return null;
  }

  const normalizedUrl = normalizeInputToUrl(trimmedInput);
  if (normalizedUrl !== null) {
    if (!LINUX_DO_HOSTS.has(normalizedUrl.hostname)) {
      return null;
    }

    return extractUserIdFromPath(normalizedUrl.pathname);
  }

  return USER_ID_PATTERN.test(trimmedInput) ? trimmedInput : null;
}

export async function fetchLinuxDoAvatar(userId: string): Promise<LinuxDoAvatarResult> {
  const response = await fetch(
    `${LINUX_DO_LOOKUP_ENDPOINT}?input=${encodeURIComponent(userId)}`,
  );

  if (response.status === 404) {
    throw new Error('未找到该 linux.do 用户，请确认 id 是否正确');
  }

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(errorPayload?.error ?? '获取 linux.do 用户信息失败，请稍后重试');
  }

  const data = (await response.json()) as Partial<LinuxDoAvatarResult>;

  if (
    typeof data.userId !== 'string' ||
    data.userId.length === 0 ||
    typeof data.avatarUrl !== 'string' ||
    data.avatarUrl.length === 0
  ) {
    throw new Error('linux.do 头像返回格式不正确');
  }

  return {
    userId: data.userId,
    avatarUrl: data.avatarUrl,
  };
}
