export function getTrackingStageFromElapsed(etaMinutes, elapsedMs, stageCount = 5) {
  const totalDurationMs = Math.max(120000, etaMinutes * 12000);
  const progress = Math.min(1, elapsedMs / totalDurationMs);
  return Math.min(stageCount - 1, Math.max(0, Math.floor(progress * (stageCount - 1))));
}
