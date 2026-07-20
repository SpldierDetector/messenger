export function formatMessageTime(createdAt: number) {
    return new Date(createdAt).toLocaleString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}