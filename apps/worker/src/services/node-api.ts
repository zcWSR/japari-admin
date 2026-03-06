import Config from '../config';

/**
 * Worker 内调用 Node 服务：图片生成等。
 * 避免在 Worker 中打包 @napi-rs/canvas、taffy-pvp-card-sw。
 */
export async function generateImage(
  type: string,
  params: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${Config.NODE_SERVER}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...params })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `generate-image ${res.status}`);
  }
  const data = (await res.json()) as { url?: string };
  return data.url ?? '';
}
