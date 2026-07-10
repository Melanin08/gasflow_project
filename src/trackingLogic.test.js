import test from "node:test";
import assert from "node:assert/strict";
import { getTrackingStageFromElapsed } from "./trackingLogic.js";

test("tracks the first stage before the delivery window starts", () => {
  assert.equal(getTrackingStageFromElapsed(15, 0), 0);
});

test("advances to later stages as the delivery window progresses", () => {
  assert.equal(getTrackingStageFromElapsed(15, 70000), 1);
  assert.equal(getTrackingStageFromElapsed(15, 150000), 2);
  assert.equal(getTrackingStageFromElapsed(15, 250000), 3);
});

test("reaches the delivered stage once the full window has elapsed", () => {
  assert.equal(getTrackingStageFromElapsed(15, 500000), 4);
});
