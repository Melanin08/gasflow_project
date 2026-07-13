export function getTrackingStageFromElapsed(etaMinutes, elapsedMs, stageCount = 5) {
  const totalDurationMs = Math.max(300000, etaMinutes * 20000);
  const progress = Math.min(1, elapsedMs / totalDurationMs);
  const stageThresholds = [0, 0.2, 0.45, 0.75, 1];
  const thresholds = stageThresholds.slice(0, stageCount);

  return Math.min(
    stageCount - 1,
    Math.max(0, thresholds.findLastIndex((threshold) => progress >= threshold))
  );
}
