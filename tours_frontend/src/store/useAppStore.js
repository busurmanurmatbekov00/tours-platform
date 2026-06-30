import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // язык
      language: 'ru',
      setLanguage: (lang) => set({ language: lang }),

      // авторизация
      token: null,
      refreshToken: null,
      user: null,
      setAuth: ({ access, refresh, user }) =>
        set({ token: access, refreshToken: refresh, user }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'tours-platform-app',
      partialize: (state) => ({
        language: state.language,
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);