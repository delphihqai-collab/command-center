const PAGE_SIZE = 20;

export function encodeCursor(id: string, sortValue: string): string {
  return Buffer.from(`${id}|${sortValue}`).toString("base64url");
}

export function decodeCursor(cursor: string): {
  id: string;
  sortValue: string;
} | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    const pipeIdx = decoded.indexOf("|");
    if (pipeIdx === -1) return null;
    return {
      id: decoded.slice(0, pipeIdx),
      sortValue: decoded.slice(pipeIdx + 1),
    };
  } catch {
    return null;
  }
}

export { PAGE_SIZE };
