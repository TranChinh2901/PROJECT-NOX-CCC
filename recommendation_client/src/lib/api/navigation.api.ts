import apiClient from './apiClient';

export interface NavigationItem {
  id: number;
  location: string;
  label: string;
  href: string;
  target: string;
  sort_order: number;
  is_active: boolean;
}

export const navigationApi = {
  async getHeaderNavigation(location: string = 'header_primary'): Promise<NavigationItem[]> {
    return apiClient.get<NavigationItem[]>('/navigation/header', {
      params: { location },
    });
  },
};
