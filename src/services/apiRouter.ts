import { baseFetch, API_ENDPOINTS } from '../config/apiConfig';

export interface LiveIdentityVerification {
  Timestamp?: string;
  UserEmail?: string;
  FullName?: string;
  IDType?: string;
  IDNumber?: string;
  VerificationStatus?: string;
  ReviewNotes?: string;
  DocumentLink?: string;
}

export interface LiveNotification {
  UserID?: string;
  Message?: string;
  Timestamp?: string;
  ReadStatus?: string | boolean;
  ItemID?: string;
}

export interface LiveFoundItem {
  id?: string;
  submissionId?: string;
  Timestamp?: string;
  FinderName?: string;
  FinderEmail?: string;
  FinderPhone?: string;
  ItemCategory?: string;
  ItemDescription?: string;
  LossLocation?: string;
  FoundDate?: string;
  StorageHub?: string;
  Status?: string;
  ImageReference?: string;
  OwnerProof?: string;
  RewardAmount?: string | number;
  ServiceFee?: string | number;
  SelectedHub?: string;
  HubLatitude?: string | number;
  HubLongitude?: string | number;
}

export const apiRouter = {
  // Fetch all found items
  async fetchFoundItems(): Promise<LiveFoundItem[]> {
    try {
      const response = await baseFetch(API_ENDPOINTS.FOUND_ITEMS);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[apiRouter Debug] fetchFoundItems failed. Status: ${response.status}. Response:`, response);
        return [];
      }
    } catch (error) {
      console.error('[apiRouter Error] fetchFoundItems exception:', error);
      return [];
    }
  },

  // Update status of a found item row by index
  async updateFoundItemStatus(index: number, status: string): Promise<boolean> {
    try {
      const response = await baseFetch(`${API_ENDPOINTS.FOUND_ITEMS}/${index}`, {
        method: 'PATCH',
        body: { Status: status },
      });
      if (!response.ok) {
        console.warn(`[apiRouter Debug] updateFoundItemStatus failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[apiRouter Error] updateFoundItemStatus exception:', error);
      return false;
    }
  },

  // Update multiple fields of a found item row by index (valuation/status sync)
  async updateFoundItemFields(index: number, fields: Record<string, any>): Promise<boolean> {
    try {
      const response = await baseFetch(`${API_ENDPOINTS.FOUND_ITEMS}/${index}`, {
        method: 'PATCH',
        body: fields,
      });
      if (!response.ok) {
        console.warn(`[apiRouter Debug] updateFoundItemFields failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[apiRouter Error] updateFoundItemFields exception:', error);
      return false;
    }
  },

  // Fetch all identity verifications
  async fetchIdentityVerifications(): Promise<LiveIdentityVerification[]> {
    try {
      const response = await baseFetch(API_ENDPOINTS.IDENTITY_VERIFICATION);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[apiRouter Debug] fetchIdentityVerifications failed. Status: ${response.status}. Response:`, response);
        return [];
      }
    } catch (error) {
      console.error('[apiRouter Error] fetchIdentityVerifications exception:', error);
      return [];
    }
  },

  // Update verification status of identity row by index
  async updateIdentityVerificationStatus(index: number, status: string): Promise<boolean> {
    try {
      const response = await baseFetch(`${API_ENDPOINTS.IDENTITY_VERIFICATION}/${index}`, {
        method: 'PATCH',
        body: { VerificationStatus: status },
      });
      if (!response.ok) {
        console.warn(`[apiRouter Debug] updateIdentityVerificationStatus failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[apiRouter Error] updateIdentityVerificationStatus exception:', error);
      return false;
    }
  },

  // Fetch all notifications from the live sheet
  async fetchNotifications(): Promise<LiveNotification[]> {
    try {
      const response = await baseFetch(API_ENDPOINTS.NOTIFICATIONS);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[apiRouter Debug] fetchNotifications failed. Status: ${response.status}. Response:`, response);
        return [];
      }
    } catch (error) {
      console.error('[apiRouter Error] fetchNotifications exception:', error);
      return [];
    }
  },

  // Append a notification row to the sheet
  async appendNotification(notification: LiveNotification): Promise<boolean> {
    try {
      const response = await baseFetch(API_ENDPOINTS.NOTIFICATIONS, {
        method: 'POST',
        body: notification,
      });
      if (!response.ok) {
        console.warn(`[apiRouter Debug] appendNotification failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[apiRouter Error] appendNotification exception:', error);
      return false;
    }
  },

  // Update a notification's ReadStatus to true by index
  async markNotificationAsRead(index: number): Promise<boolean> {
    try {
      const response = await baseFetch(`${API_ENDPOINTS.NOTIFICATIONS}/${index}`, {
        method: 'PATCH',
        body: { ReadStatus: true },
      });
      if (!response.ok) {
        console.warn(`[apiRouter Debug] markNotificationAsRead failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[apiRouter Error] markNotificationAsRead exception:', error);
      return false;
    }
  }
};
