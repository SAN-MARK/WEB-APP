/**
 * Unified Database Service for Sheet.best API Integration
 * Centralized to Endpoint: https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388
 */

import { baseFetch, API_ENDPOINTS, CONNECTION_URL } from '../config/apiConfig';

export interface UserLoginPayload {
  Timestamp: string;
  Name: string;
  Email: string;
  Phone: string;
}

export interface FileSubmissionPayload {
  Timestamp: string;
  Type: 'Finder' | 'Owner';
  ItemDescription: string;
  HubLocation: string;
  FileName: string;
}

export interface FoundItemSubmissionPayload {
  Timestamp: string;
  FinderName: string;
  FinderEmail: string;
  FinderPhone: string;
  ItemCategory: string;
  ItemDescription: string;
  LossLocation: string;
  FoundDate: string;
  StorageHub: string;
  Status: string;
  ImageReference: string;
  "Item Name"?: string;
  "Location"?: string;
  "Description"?: string;
  "Date Found"?: string;
  RewardAmount?: number;
  ServiceFee?: number;
  SelectedHub?: string;
  HubLatitude?: number;
  HubLongitude?: number;
}

export interface IdentityVerificationPayload {
  Timestamp: string;
  UserEmail: string;
  FullName: string;
  IDType: string;
  IDNumber: string;
  VerificationStatus: string;
  ReviewNotes: string;
  DocumentLink: string;
}

export const dbService = {
  /**
   * Records a user registration or login in the 'Users' tab
   */
  async recordUserLogin(payload: UserLoginPayload): Promise<boolean> {
    try {
      console.log('Sending user login record to Sheet.best Users tab:', payload);
      const response = await baseFetch(API_ENDPOINTS.USERS, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        console.log('Successfully recorded user login!');
        return true;
      } else {
        console.warn(`[dbService Debug] recordUserLogin response not OK. Status: ${response.status}. Trying fallback...`, response);
        // Fallback to main sheet just in case tabs are not configured
        const fallbackRes = await baseFetch(CONNECTION_URL, {
          method: 'POST',
          body: { ...payload, _sheet: 'Users' },
        });
        return fallbackRes.ok;
      }
    } catch (error) {
      console.error('[dbService Error] recordUserLogin failed:', error);
      return false;
    }
  },

  /**
   * Records a finder item photo upload or owner proof document in the 'Submissions' tab (legacy/optional fallback)
   */
  async recordFileSubmission(payload: FileSubmissionPayload): Promise<boolean> {
    try {
      console.log('Sending file submission to Sheet.best:', payload);
      const response = await baseFetch(`${CONNECTION_URL}/tabs/Submissions`, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        console.log('Successfully recorded file submission!');
        return true;
      } else {
        console.warn(`[dbService Debug] recordFileSubmission response not OK. Status: ${response.status}. Trying fallback...`, response);
        const fallbackRes = await baseFetch(CONNECTION_URL, {
          method: 'POST',
          body: { ...payload, _sheet: 'Submissions' },
        });
        return fallbackRes.ok;
      }
    } catch (error) {
      console.error('[dbService Error] recordFileSubmission failed:', error);
      return false;
    }
  },

  /**
   * Submits a newly reported found item to the dedicated Found Items Sheet.best endpoint
   */
  async submitFoundItem(payload: FoundItemSubmissionPayload): Promise<boolean> {
    try {
      console.log('Submitting found item report to centralized Sheet.best tab:', payload);
      const response = await baseFetch(API_ENDPOINTS.FOUND_ITEMS, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        console.log('Successfully logged found item report on centralized Sheet.best tab!');
        return true;
      } else {
        console.warn(`[dbService Debug] submitFoundItem failed. Status: ${response.status}. Response:`, response);
        return false;
      }
    } catch (error) {
      console.error('[dbService Error] submitFoundItem failed:', error);
      return false;
    }
  },

  /**
   * Submits identity verification to the dedicated Identity Verification Sheet.best endpoint
   */
  async submitIdentityVerification(payload: IdentityVerificationPayload): Promise<boolean> {
    try {
      console.log('Submitting identity verification to centralized Sheet.best tab:', payload);
      const response = await baseFetch(API_ENDPOINTS.IDENTITY_VERIFICATION, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        console.log('Successfully logged identity verification on centralized Sheet.best tab!');
        return true;
      } else {
        console.warn(`[dbService Debug] submitIdentityVerification failed. Status: ${response.status}. Response:`, response);
        return false;
      }
    } catch (error) {
      console.error('[dbService Error] submitIdentityVerification failed:', error);
      return false;
    }
  },

  /**
   * Fetches all found items from the live sheet
   */
  async fetchFoundItems(): Promise<any[]> {
    try {
      const response = await baseFetch(API_ENDPOINTS.FOUND_ITEMS);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[dbService Debug] fetchFoundItems failed. Status: ${response.status}. Response:`, response);
        return [];
      }
    } catch (error) {
      console.error('[dbService Error] fetchFoundItems failed:', error);
      return [];
    }
  },

  /**
   * Updates the status of a found item by its index in Sheet.best
   */
  async updateFoundItemStatus(index: number, status: string): Promise<boolean> {
    try {
      console.log(`Updating status of found item at index ${index} to ${status}`);
      const response = await baseFetch(`${API_ENDPOINTS.FOUND_ITEMS}/${index}`, {
        method: 'PATCH',
        body: { Status: status },
      });
      if (!response.ok) {
        console.warn(`[dbService Debug] updateFoundItemStatus failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[dbService Error] updateFoundItemStatus failed:', error);
      return false;
    }
  },

  /**
   * Fetches all identity verifications from the live sheet
   */
  async fetchIdentityVerifications(): Promise<any[]> {
    try {
      const response = await baseFetch(API_ENDPOINTS.IDENTITY_VERIFICATION);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.warn(`[dbService Debug] fetchIdentityVerifications failed. Status: ${response.status}. Response:`, response);
        return [];
      }
    } catch (error) {
      console.error('[dbService Error] fetchIdentityVerifications failed:', error);
      return [];
    }
  },

  /**
   * Updates verification status of an identity row by index in Sheet.best
   */
  async updateIdentityVerificationStatus(index: number, status: string): Promise<boolean> {
    try {
      console.log(`Updating verification status of row at index ${index} to ${status}`);
      const response = await baseFetch(`${API_ENDPOINTS.IDENTITY_VERIFICATION}/${index}`, {
        method: 'PATCH',
        body: { VerificationStatus: status },
      });
      if (!response.ok) {
        console.warn(`[dbService Debug] updateIdentityVerificationStatus failed. Status: ${response.status}. Response:`, response);
      }
      return response.ok;
    } catch (error) {
      console.error('[dbService Error] updateIdentityVerificationStatus failed:', error);
      return false;
    }
  },

  /**
   * Searches for a found item by submissionId and updates its status to 'Under Review' and OwnerProof with owner proof details
   */
  async claimItemWithProofBySubmissionId(submissionId: string, proofDetail: string): Promise<boolean> {
    try {
      console.log(`Searching for item to claim with submissionId: ${submissionId}`);
      const items = await dbService.fetchFoundItems();
      const rowIndex = items.findIndex((item: any) => 
        (item.submissionId && String(item.submissionId).trim() === String(submissionId).trim()) ||
        (item['SubmissionId'] && String(item['SubmissionId']).trim() === String(submissionId).trim()) ||
        (item['submissionId'] && String(item['submissionId']).trim() === String(submissionId).trim()) ||
        (item['Item Name'] && String(item['Item Name']).includes(String(submissionId))) ||
        (item['Description'] && String(item['Description']).includes(String(submissionId)))
      );

      if (rowIndex !== -1) {
        console.log(`Found item at row index ${rowIndex}. Updating status and OwnerProof...`);
        const response = await baseFetch(`${API_ENDPOINTS.FOUND_ITEMS}/${rowIndex}`, {
          method: 'PATCH',
          body: {
            Status: 'Under Review',
            OwnerProof: proofDetail
          },
        });
        if (!response.ok) {
          console.warn(`[dbService Debug] claimItemWithProofBySubmissionId failed. Status: ${response.status}. Response:`, response);
        }
        return response.ok;
      } else {
        console.warn(`No item found in spreadsheet matching submissionId: ${submissionId}`);
        return false;
      }
    } catch (error) {
      console.error('[dbService Error] claimItemWithProofBySubmissionId failed:', error);
      return false;
    }
  }
};
