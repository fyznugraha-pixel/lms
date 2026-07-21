import en from '../locales/en.json';
import id from '../locales/id.json';

const dictionaries = {
  en,
  id,
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = (locale: string) => {
  return dictionaries[locale as Locale] ?? dictionaries.en;
};