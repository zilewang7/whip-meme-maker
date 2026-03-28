import {
  buildAvatarProxyUrl,
  fetchLinuxDoAvatarTemplateViaBrowser,
  hasAllowedSiteContext,
  jsonResponse,
  parseAvatarTemplate,
  readAndValidateInput,
  readAndValidateUserId,
} from './_lib/linuxDoServer';

export async function GET(request: Request): Promise<Response> {
  if (!hasAllowedSiteContext(request)) {
    return jsonResponse({ error: '非法请求来源' }, 403);
  }

  const input = readAndValidateInput(request);
  if (input === null) {
    return jsonResponse({ error: '请输入 linux.do 用户 id 或合法的用户主页地址' }, 400);
  }

  const userId = readAndValidateUserId(input);
  if (userId === null) {
    return jsonResponse({ error: '请输入合法的 linux.do 用户 id 或用户主页地址' }, 400);
  }

  try {
    const avatarTemplate = await fetchLinuxDoAvatarTemplateViaBrowser(userId);
    const parsedTemplate = parseAvatarTemplate(avatarTemplate, userId);

    if (parsedTemplate === null) {
      return jsonResponse({ error: 'linux.do 返回了无法识别的头像模板' }, 502);
    }

    return Response.json(
      {
        userId: parsedTemplate.userId,
        avatarUrl: buildAvatarProxyUrl(request, parsedTemplate.userId, avatarTemplate),
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '获取 linux.do 头像失败，请稍后重试';

    return jsonResponse({ error: message }, 502);
  }
}
