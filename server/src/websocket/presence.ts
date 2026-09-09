const connectionCounts = new Map<number, number>();

export function addUserConnection(
  userId: number,
) {
  const currentCount =
    connectionCounts.get(userId) ?? 0;

  connectionCounts.set(
    userId,
    currentCount + 1,
  );
}

export function removeUserConnection(
  userId: number,
) {
  const currentCount = 
    connectionCounts.get(userId) ?? 0;

  if (currentCount <= 1) {
    connectionCounts.delete(userId);

    return;
  }

  connectionCounts.set(
    userId,
    currentCount - 1,
  );
}

export function isUserOnline(
  userId: number,
) {
  return (
    connectionCounts.get(userId) ?? 0
  ) > 0;
}