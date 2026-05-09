export function parseYoutubeUrl(input: any): any {
  const value = String(input || "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (["youtu.be", "www.youtu.be"].includes(parsed.hostname)) {
    const videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  }
  if (
    ![
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
    ].includes(parsed.hostname)
  ) {
    return null;
  }
  if (parsed.pathname === "/watch") {
    const videoId = parsed.searchParams.get("v");
    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  }
  const pathMatch = parsed.pathname.match(
    /^\/(?:shorts|embed|v|live)\/([A-Za-z0-9_-]{11})/,
  );
  return pathMatch ? pathMatch[1] : null;
}
export function formatTimestamp(seconds: any): any {
  const total = Math.trunc(Number(seconds) || 0);
  const hours = Math.trunc(total / 3600);
  const minutes = Math.trunc((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
export function sanitizeFilename(title: any): any {
  const cleaned = String(title || "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/[\s-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned ? cleaned.slice(0, 200) : "untitled";
}
export function chunkTranscript(transcript: any, chunkMinutes: any = 5): any {
  if (!Array.isArray(transcript) || transcript.length === 0) return [];
  const chunkSeconds = chunkMinutes * 60;
  const chunks: any[] = [];
  let currentTexts: any[] = [];
  let chunkStart = 0.0;
  let chunkBoundary = chunkSeconds;
  for (const segment of transcript) {
    const segmentStart = Number(segment.start || 0.0);
    const segmentText = String(segment.text || "").trim();
    if (segmentStart >= chunkBoundary && currentTexts.length > 0) {
      chunks.push({
        start: chunkStart,
        end: segmentStart,
        start_formatted: formatTimestamp(chunkStart),
        end_formatted: formatTimestamp(segmentStart),
        text: currentTexts.join(" "),
      });
      currentTexts = [];
      chunkStart = segmentStart;
      chunkBoundary = chunkStart + chunkSeconds;
    }
    if (segmentText) currentTexts.push(segmentText);
  }
  if (currentTexts.length > 0) {
    const lastSegment = transcript[transcript.length - 1];
    const endTime =
      Number(lastSegment.start || 0.0) + Number(lastSegment.duration || 0.0);
    chunks.push({
      start: chunkStart,
      end: endTime,
      start_formatted: formatTimestamp(chunkStart),
      end_formatted: formatTimestamp(endTime),
      text: currentTexts.join(" "),
    });
  }
  return chunks;
}
export function estimateDurationCategory(seconds: any): any {
  const duration = Number(seconds) || 0;
  if (duration < 600) return "short";
  if (duration < 1800) return "medium";
  if (duration < 5400) return "long";
  return "extended";
}
