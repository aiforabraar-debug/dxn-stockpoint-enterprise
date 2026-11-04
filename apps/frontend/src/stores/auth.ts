/**
 * Auth store — tracks authentication state for shop PIN and staff users.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthState {
  isAuthenticated: boolean;
  authType: 'shop_pin' | 'staff' | null;
  role: string | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  } | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
  token: string | null;

  setShopAuth: (shop: { id: string; name: string; slug: string; currency: string }, token: string) => void;
  setStaffAuth: (user: { id: string; email: string; fullName: string; role: string }, shop: any, token: string) => void;
  clearAuth: () => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      authType: null,
      role: null,
      shop: null,
      user: null,
      token: null,

      setShopAuth: (shop, token) => {
        localStorage.setItem('dxn_access_token', token);
        set({
          isAuthenticated: true,
          authType: 'shop_pin',
          role: 'admin',
          shop,
          user: null,
          token,
        });
      },

      setStaffAuth: (user, shop, token) => {
        localStorage.setItem('dxn_access_token', token);
        set({
          isAuthenticated: true,
          authType: 'staff',
          role: user.role,
          shop: {
            id: shop.id,
            name: shop.name,
            slug: shop.slug,
            currency: shop.currency,
          },
          user,
          token,
        });
      },

      clearAuth: () => {
        localStorage.removeItem('dxn_access_token');
        set({
          isAuthenticated: false,
          authType: null,
          role: null,
          shop: null,
          user: null,
          token: null,
        });
      },

      setToken: (token) => {
        if (token) {
          localStorage.setItem('dxn_access_token', token);
        } else {
          localStorage.removeItem('dxn_access_token');
        }
        set({ token });
      },
    }),
    {
      name: 'dxn-auth-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authType: state.authType,
        role: state.role,
        shop: state.shop,
        user: state.user,
        token: state.token,
      }),
    }
  )
);
