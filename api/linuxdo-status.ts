export async function GET(): Promise<Response> {
  const enabled =
    typeof process.env.BROWSER_WS === 'string' && process.env.BROWSER_WS.trim().length > 0;

  return Response.json(
    { enabled },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  );
}
