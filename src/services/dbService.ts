/**
 * Unified Database Service for Sheet.best API Integration
 * Endpoint: https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388
 */

const BASE_URL = 'https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388';

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

export const dbService = {
  /**
   * Records a user registration or login in the 'Users' tab
   */
  async recordUserLogin(payload: UserLoginPayload): Promise<boolean> {
    try {
      console.log('Sending user login record to Sheet.best:', payload);
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
      // We will return true to proceed gracefully in case of offline/network blockages
      return false;
    }
  },

  /**
   * Records a finder item photo upload or owner proof document in the 'Submissions' tab
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
        // Fallback to main sheet just in case tabs are not configured
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
  }
};
