import Config from '../config';

/**
 * Worker 内调用 Node 服务：图片生成等。
 * 避免在 Worker 中打包 @napi-rs/canvas、taffy-pvp-card-sw。
 */
export async function generateImage(type, params) {
  const base = (Config.NODE_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('NODE_URL 未配置，无法生成图片');
  const res = await fetch(`${base}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...params })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `generate-image ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}
