"use client";
import { createContext, ReactNode, useContext, useState } from "react";

export type Theme = "light" | "taupe" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  alertNotifications: boolean;
  setAlertNotifications: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("taupe");
  const [alertNotifications, setAlertNotifications] = useState<boolean>(true);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, alertNotifications, setAlertNotifications }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
