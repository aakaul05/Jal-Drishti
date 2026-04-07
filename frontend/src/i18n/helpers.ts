import type { MessageKey } from "@/i18n/translations";

export function monthSelectOptions(t: (key: MessageKey) => string) {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: t(`month_${i + 1}` as MessageKey),
  }));
}

export function monthShortLabels(t: (key: MessageKey) => string): string[] {
  return Array.from({ length: 12 }, (_, i) => t(`mon_${i + 1}` as MessageKey));
}
