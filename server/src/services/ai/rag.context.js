export const LEGACY_COLLECTION_NAME = "scrum_knowledge_base_v2";
export const BOARD_COLLECTION_PREFIX = "scrum_knowledge_base_board";

export const normalizeBoardId = (boardId) => {
  if (boardId === null || boardId === undefined) return null;

  if (typeof boardId === "number" && Number.isFinite(boardId)) {
    return String(Math.trunc(boardId));
  }

  const normalized = String(boardId).trim();
  return normalized.length > 0 ? normalized : null;
};

export const sanitizeCollectionSegment = (value) => {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
};

export const buildBoardCollectionName = (boardId) => {
  const normalizedBoardId = normalizeBoardId(boardId);
  if (!normalizedBoardId) {
    throw new Error("boardId is required to build a board collection name");
  }
  return `${BOARD_COLLECTION_PREFIX}_${sanitizeCollectionSegment(normalizedBoardId)}`;
};

export const getCandidateCollectionNames = (
  boardId,
  { includeLegacyFallback = true } = {},
) => {
  const normalizedBoardId = normalizeBoardId(boardId);
  if (!normalizedBoardId) return [LEGACY_COLLECTION_NAME];

  const primary = buildBoardCollectionName(normalizedBoardId);
  return includeLegacyFallback
    ? [primary, LEGACY_COLLECTION_NAME]
    : [primary];
};

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const extractBoardIdFromJiraPayload = (payload = {}) => {
  const directCandidates = [
    payload?.boardId,
    payload?.board?.id,
    payload?.sprint?.originBoardId,
    payload?.issue?.fields?.boardId,
    payload?.issue?.fields?.board?.id,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeBoardId(candidate);
    if (normalized) return normalized;
  }

  const visited = new Set();
  const stack = [payload];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!isObject(current) || visited.has(current)) continue;
    visited.add(current);

    const originBoardId = normalizeBoardId(current.originBoardId);
    if (originBoardId) return originBoardId;

    const boardId = normalizeBoardId(current.boardId);
    if (boardId) return boardId;

    for (const value of Object.values(current)) {
      if (isObject(value)) {
        stack.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (isObject(item)) stack.push(item);
        });
      }
    }
  }

  return null;
};
