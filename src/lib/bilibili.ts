export function biliEmbedUrl(bvid: string, autoplay = false): string {
  const params = new URLSearchParams({
    bvid,
    autoplay: autoplay ? '1' : '0',
    danmaku: '0',
  });
  return `https://player.bilibili.com/player.html?${params.toString()}`;
}