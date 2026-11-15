export const POSITION_STEP = 1024;
export const MIN_POSITION_GAP = 1e-5;

/**
 * Computes the new position based on previous and next ticket positions.
 * @param {number|null} prevPos - Position of ticket directly above, or null if placed at the top.
 * @param {number|null} nextPos - Position of ticket directly below, or null if placed at the bottom.
 * @returns {{ position: number, needsRebalance: boolean }}
 */
export const calculatePosition = (prevPos, nextPos) => {
  if (prevPos == null && nextPos == null) {
    return { position: POSITION_STEP, needsRebalance: false };
  }
  if (prevPos == null && nextPos != null) {
    const position = nextPos / 2;
    return {
      position,
      needsRebalance: position < MIN_POSITION_GAP
    };
  }
  if (prevPos != null && nextPos == null) {
    return {
      position: prevPos + POSITION_STEP,
      needsRebalance: false
    };
  }
  // Between two cards
  const gap = nextPos - prevPos;
  const position = prevPos + gap / 2;
  return {
    position,
    needsRebalance: gap < MIN_POSITION_GAP
  };
};
