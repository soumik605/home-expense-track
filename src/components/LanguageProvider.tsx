import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LanguageContext, type LanguageValue } from '../hooks/useLanguage';
import { bengaliItem, itemLabel, type Lang } from '../lib/itemNames';

const KEY = 'hbt:lang';

/** Item names show in Bengali by default; the choice is remembered on this device. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(KEY) === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === 'bn' ? 'en' : 'bn')), []);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      toggle,
      item: (name) => itemLabel(name, lang),
      itemLang: (name) => (lang === 'bn' && bengaliItem(name) ? 'bn' : 'en'),
    }),
    [lang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
