import { createContext, useContext } from 'react';
import type { Lang } from '../lib/itemNames';

export interface LanguageValue {
  lang: Lang;
  toggle: () => void;
  /** Display name for an item in the current language (falls back to the sheet's value). */
  item: (name: string) => string;
  /** `lang` attribute for an item's display text, so screen readers pronounce it correctly. */
  itemLang: (name: string) => Lang;
}

export const LanguageContext = createContext<LanguageValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
