const FOUND_ITEMS_API = "https://api.sheetbest.com/sheets/81694254-e251-4c0b-8e36-245d7f2affab";
const IDENTITY_VERIFICATION_API = "https://api.sheetbest.com/sheets/ad425445-e829-4f06-85f7-c93d78761822";

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

export interface LiveFoundItem {
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
      return response.ok;
    } catch (error) {
      console.error('Failed to update found item status:', error);
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
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch identity verifications:', error);
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
      return response.ok;
    } catch (error) {
      console.error('Failed to update identity status:', error);
      return false;
    }
  }
};
