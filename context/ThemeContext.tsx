import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  border: string;
  navBg: string;
  navBorder: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

const darkColors: ThemeColors = {
  background: '#0d1117',
  card: '#1a1f2e',
  cardAlt: '#1e293b',
  text: '#ffffff',
  textMuted: '#94a3b8',
  border: 'rgba(255, 255, 255, 0.08)',
  navBg: '#1a1f2e',
  navBorder: '#2a2f3e',
  statusBarStyle: 'light-content',
};

const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  cardAlt: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  navBg: '#ffffff',
  navBorder: '#e2e8f0',
  statusBarStyle: 'dark-content',
};

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  setIsDarkMode: () => {},
  colors: darkColors,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted theme preference
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('userTheme');
        if (storedTheme !== null) {
          setIsDarkModeState(storedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const setIsDarkMode = async (val: boolean) => {
    setIsDarkModeState(val);
    try {
      await AsyncStorage.setItem('userTheme', val ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, colors }}>
      {!loading && children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
