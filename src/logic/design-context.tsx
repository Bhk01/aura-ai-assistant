import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export type Language = "fr" | "en" | "ar";
export type CopyKey = keyof typeof fr;
const dictionaries = { fr, en, ar };
type DesignContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  t: (key: CopyKey) => string;
};
const DesignContext = createContext<DesignContextValue | null>(null);
export function DesignProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const t = useCallback((key: CopyKey) => dictionaries[language][key], [language]);
  const value = useMemo(
    () => ({ language, setLanguage, theme, setTheme, t }),
    [language, theme, t],
  );
  return (
    <DesignContext.Provider value={value}>
      <div
        className={`hub-app ${theme === "light" ? "theme-light" : ""}`}
        dir={language === "ar" ? "rtl" : "ltr"}
        lang={language}
      >
        {children}
      </div>
    </DesignContext.Provider>
  );
}
export function useDesign() {
  const value = useContext(DesignContext);
  if (!value) throw new Error("DesignProvider is required");
  return value;
}
