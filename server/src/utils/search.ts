export function normalizeSearchText(
  value: string,
): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim()
    .replace(/\s+/g, ' ');
}

export function getSearchTerms(
  value: string,
): string[] {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return [];
  }

  return [
    ...new Set(
      normalizedValue.split(' '),
    ),
  ];
}