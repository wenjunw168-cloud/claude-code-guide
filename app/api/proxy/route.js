export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const { __target_url__: targetUrl, __api_key__: apiKey, ...body } = payload;

  if (!targetUrl) {
    return Response.json({ error: { message: 'Missing __target_url__' } }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json(
      { error: { message: `上游请求失败: ${e.message}` } },
      { status: 502 }
    );
  }
}
