const estimateTokenCount = (text) => {
  return Math.ceil((text || "").length / 4);
};
const getComplexityTier = (tokenCount) => {
  if (tokenCount < 8e3) return "small";
  if (tokenCount < 25e3) return "medium";
  if (tokenCount < 6e4) return "large";
  return "xlarge";
};
export {
  estimateTokenCount,
  getComplexityTier
};
