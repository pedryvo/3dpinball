import { de } from './de';
import { en } from './en';
import { es } from './es';
import { ptBR } from './pt-BR';
import { ru } from './ru';
import type { LocaleCode, TranslationDictionary } from './types';
import { zhCN } from './zh-CN';

export type { LocaleCode, TranslationDictionary } from './types';

export const TRANSLATIONS: Record<LocaleCode, TranslationDictionary> = {
  'pt-BR': ptBR,
  en,
  es,
  ru,
  'zh-CN': zhCN,
  de,
};

export const SUPPORTED_LOCALES: LocaleCode[] = ['pt-BR', 'en', 'es', 'ru', 'zh-CN', 'de'];

const STORAGE_KEY = '3dpinball_locale';

export function detectInitialLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
    if (saved && saved in TRANSLATIONS) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('pt')) return 'pt-BR';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('zh')) return 'zh-CN';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('en')) return 'en';
  }

  return 'pt-BR';
}

type LocaleListener = (dict: TranslationDictionary) => void;

class I18nManager {
  private currentLocale: LocaleCode = detectInitialLocale();
  private listeners = new Set<LocaleListener>();

  get locale(): LocaleCode {
    return this.currentLocale;
  }

  get t(): TranslationDictionary {
    return TRANSLATIONS[this.currentLocale];
  }

  setLocale(locale: LocaleCode): void {
    if (!(locale in TRANSLATIONS)) return;
    this.currentLocale = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.title = this.t.windowTitle;
    }
    for (const listener of this.listeners) {
      listener(this.t);
    }
  }

  subscribe(listener: LocaleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nManager();
