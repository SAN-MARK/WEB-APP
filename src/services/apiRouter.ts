const FOUND_ITEMS_API = "https://api.sheetbest.com/sheets/81694254-e251-4c0b-8e36-245d7f2affab";
const IDENTITY_VERIFICATION_API = "https://api.sheetbest.com/sheets/ad425445-e829-4f06-85f7-c93d78761822";
const NOTIFICATIONS_API = "https://api.sheetbest.com/sheets/81694254-e251-4c0b-8e36-245d7f2affab/tabs/Notifications";

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
}

export const apiRouter = {
  // Fetch all found items
  async fetchFoundItems(): Promise<LiveFoundItem[]> {
    try {
      const response = await fetch(FOUND_ITEMS_API);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch found items:', error);
      return [];
    }
  },

  // Update status of a found item row by index
  async updateFoundItemStatus(index: number, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${FOUND_ITEMS_API}/${index}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Status: status }),
      });
      if (!response.ok) {
        console.warn(`[API Permission Debug] Failed updateFoundItemStatus. Status: ${response.status}. Verify Sheet Best API write permissions.`);
      }
      return response.ok;
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in updateFoundItemStatus:', error);
      return false;
    }
  },

  // Update multiple fields of a found item row by index (valuation/status sync)
  async updateFoundItemFields(index: number, fields: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${FOUND_ITEMS_API}/${index}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        console.warn(`[API Permission Debug] Failed updateFoundItemFields. Status: ${response.status}. Verify Sheet Best API write permissions.`);
      }
      return response.ok;
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in updateFoundItemFields:', error);
      return false;
    }
  },

  // Fetch all identity verifications
  async fetchIdentityVerifications(): Promise<LiveIdentityVerification[]> {
    try {
      const response = await fetch(IDENTITY_VERIFICATION_API);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[API Permission Debug] Failed to fetch identity verifications. Status: ${response.status}. Verify read permissions.`);
      }
      return [];
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in fetchIdentityVerifications:', error);
      return [];
    }
  },

  // Update verification status of identity row by index
  async updateIdentityVerificationStatus(index: number, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${IDENTITY_VERIFICATION_API}/${index}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ VerificationStatus: status }),
      });
      if (!response.ok) {
        console.warn(`[API Permission Debug] Failed to update identity verification status. Status: ${response.status}. Verify write permissions.`);
      }
      return response.ok;
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in updateIdentityVerificationStatus:', error);
      return false;
    }
  },

  // Fetch all notifications from the live sheet
  async fetchNotifications(): Promise<LiveNotification[]> {
    try {
      const response = await fetch(NOTIFICATIONS_API);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[API Permission Debug] Failed to fetch notifications. Status: ${response.status}. Verify read permissions or if tab exists.`);
      }
      return [];
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in fetchNotifications:', error);
      return [];
    }
  },

  // Append a notification row to the sheet
  async appendNotification(notification: LiveNotification): Promise<boolean> {
    try {
      const response = await fetch(NOTIFICATIONS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });
      if (!response.ok) {
        console.warn(`[API Permission Debug] Failed to append notification. Status: ${response.status}. Verify write permissions.`);
      }
      return response.ok;
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in appendNotification:', error);
      return false;
    }
  },

  // Update a notification's ReadStatus to true by index
  async markNotificationAsRead(index: number): Promise<boolean> {
    try {
      const response = await fetch(`${NOTIFICATIONS_API}/${index}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ReadStatus: true }),
      });
      if (!response.ok) {
        console.warn(`[API Permission Debug] Failed to mark notification as read. Status: ${response.status}. Verify write permissions.`);
      }
      return response.ok;
    } catch (error) {
      console.error('[API Permission Debug] Network or permission error in markNotificationAsRead:', error);
      return false;
    }
  }
};
