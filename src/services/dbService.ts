/**
 * Unified Database Service for Sheet.best API Integration
 * Endpoint: https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388
 */

const BASE_URL = 'https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388';

const FOUND_ITEMS_URL = 'https://api.sheetbest.com/sheets/81694254-e251-4c0b-8e36-245d7f2affab';
const IDENTITY_VERIFICATION_URL = 'https://api.sheetbest.com/sheets/ad425445-e829-4f06-85f7-c93d78761822';

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
      const response = await fetch(`${BASE_URL}/tabs/Users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Successfully recorded user login!');
        return true;
      } else {
        console.warn('Sheet.best response not OK, attempting fallback directly to main endpoint...', response.status);
        // Fallback to main sheet just in case tabs are not configured
        const fallbackRes = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...payload, _sheet: 'Users' }),
        });
        return fallbackRes.ok;
      }
    } catch (error) {
      console.error('Failed to submit user login to Sheet.best:', error);
      // We will return false to proceed gracefully in case of offline/network blockages
      return false;
    }
  },

  /**
   * Records a finder item photo upload or owner proof document in the 'Submissions' tab (legacy/optional fallback)
   */
  async recordFileSubmission(payload: FileSubmissionPayload): Promise<boolean> {
    try {
      console.log('Sending file submission to Sheet.best:', payload);
      const response = await fetch(`${BASE_URL}/tabs/Submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Successfully recorded file submission!');
        return true;
      } else {
        console.warn('Sheet.best response not OK, attempting fallback directly to main endpoint...', response.status);
        const fallbackRes = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...payload, _sheet: 'Submissions' }),
        });
        return fallbackRes.ok;
      }
    } catch (error) {
      console.error('Failed to submit file record to Sheet.best:', error);
      return false;
    }
  },

  /**
   * Submits a newly reported found item to the dedicated Found Items Sheet.best endpoint
   */
  async submitFoundItem(payload: FoundItemSubmissionPayload): Promise<boolean> {
    try {
      console.log('Submitting found item report directly to live Sheet.best endpoint:', payload);
      const response = await fetch(FOUND_ITEMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Successfully logged found item report on live Sheet.best endpoint!');
        return true;
      } else {
        console.warn('Found item endpoint responded with non-OK status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Failed to communicate with live Found Items Sheet.best endpoint:', error);
      return false;
    }
  },

  /**
   * Submits identity verification to the dedicated Identity Verification Sheet.best endpoint
   */
  async submitIdentityVerification(payload: IdentityVerificationPayload): Promise<boolean> {
    try {
      console.log('Submitting identity verification directly to live Sheet.best endpoint:', payload);
      const response = await fetch(IDENTITY_VERIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Successfully logged identity verification on live Sheet.best endpoint!');
        return true;
      } else {
        console.warn('Identity verification endpoint responded with non-OK status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Failed to communicate with live Identity Verification Sheet.best endpoint:', error);
      return false;
    }
  },

  /**
   * Fetches all found items from the live sheet
   */
  async fetchFoundItems(): Promise<any[]> {
    try {
      const response = await fetch(FOUND_ITEMS_URL);
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

  /**
   * Updates the status of a found item by its index in Sheet.best
   */
  async updateFoundItemStatus(index: number, status: string): Promise<boolean> {
    try {
      console.log(`Updating status of found item at index ${index} to ${status}`);
      const response = await fetch(`${FOUND_ITEMS_URL}/${index}`, {
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

  /**
   * Fetches all identity verifications from the live sheet
   */
  async fetchIdentityVerifications(): Promise<any[]> {
    try {
      const response = await fetch(IDENTITY_VERIFICATION_URL);
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

  /**
   * Updates verification status of an identity row by index in Sheet.best
   */
  async updateIdentityVerificationStatus(index: number, status: string): Promise<boolean> {
    try {
      console.log(`Updating verification status of row at index ${index} to ${status}`);
      const response = await fetch(`${IDENTITY_VERIFICATION_URL}/${index}`, {
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
        const response = await fetch(`${FOUND_ITEMS_URL}/${rowIndex}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Status: 'Under Review',
            OwnerProof: proofDetail
          }),
        });
        return response.ok;
      } else {
        console.warn(`No item found in spreadsheet matching submissionId: ${submissionId}`);
        return false;
      }
    } catch (error) {
      console.error('Failed to claim item with proof:', error);
      return false;
    }
  }
};

