import {
  buildLinuxDoCdnAvatarUrl,
  hasAllowedSiteContext,
  jsonResponse,
  parseAvatarTemplate,
} from './_lib/linuxDoServer';

export async function GET(request: Request): Promise<Response> {
  if (!hasAllowedSiteContext(request)) {
    return jsonResponse({ error: '非法请求来源' }, 403);
  }

  const requestUrl = new URL(request.url);
  const userId = requestUrl.searchParams.get('userId');
  const template = requestUrl.searchParams.get('template');

  if (userId === null || template === null) {
    return jsonResponse({ error: '缺少头像参数' }, 400);
  }

  const parsedTemplate = parseAvatarTemplate(template, userId);
  if (parsedTemplate === null) {
    return jsonResponse({ error: '非法头像模板' }, 400);
  }

  try {
    const upstreamResponse = await fetch(
      buildLinuxDoCdnAvatarUrl(parsedTemplate.userId, parsedTemplate.fileName),
      {
        headers: {
          accept: 'image/*',
        },
      },
    );

    if (upstreamResponse.status === 404) {
      return jsonResponse({ error: '未找到头像图片' }, 404);
    }

    if (!upstreamResponse.ok) {
      return jsonResponse({ error: '头像图片拉取失败，请稍后重试' }, 502);
    }

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType === null || !contentType.startsWith('image/')) {
      return jsonResponse({ error: '头像图片响应格式不正确' }, 502);
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return jsonResponse({ error: '头像图片拉取失败，请稍后重试' }, 502);
  }
}
