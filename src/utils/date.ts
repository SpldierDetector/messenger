export function formatMessageTime(createdAt: number) {
  return new Date(createdAt).toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isSameDay(
  firstTimestamp: number,
  secondTimestamp: number
) {
  const firstDate = new Date(firstTimestamp);
  const secondDate = new Date(secondTimestamp);

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function formatMessageDate(createdAt: number) {
  const messageDate = new Date(createdAt);
  const today = new Date();

  if (isSameDay(createdAt, today.getTime())) {
    return 'Сегодня';
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(createdAt, yesterday.getTime())) {
    return 'Вчера';
  }

  return messageDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year:
      messageDate.getFullYear() !== today.getFullYear()
      ? 'numeric'
      : undefined,
  });
}