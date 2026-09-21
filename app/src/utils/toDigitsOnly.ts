export function toDigitsOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}
