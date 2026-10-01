const voiceDrafts = new Map<string, string>();

function getVoiceDraftKey(
  chatId: number,
  token: string,
): string {
  return `${token}:${chatId}`;
}

export function getVoiceDraft(
  chatId: number,
  token: string,
): string | null {
  return (
    voiceDrafts.get(
      getVoiceDraftKey(chatId, token),
    ) ?? null
  );
}

export function saveVoiceDraft(
  chatId: number,
  token: string,
  uri: string,
): void {
  voiceDrafts.set(
    getVoiceDraftKey(chatId, token),
    uri,
  );
}

export function clearVoiceDraft(
  chatId: number,
  token: string,
): void {
  voiceDrafts.delete(
    getVoiceDraftKey(chatId, token),
  );
}