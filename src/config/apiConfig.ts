/**
 * Centralized API Configuration for FindBack
 * Ensure the Google Sheet associated with 93812d90-9938-4f16-acd9-09b79ed50388 is shared with 'Anyone with the link' and has 'Editor' permissions.
 */

export const CONNECTION_URL = 'https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388';

export const API_ENDPOINTS = {
  USERS: `${CONNECTION_URL}/tabs/Users`,
  FOUND_ITEMS: `${CONNECTION_URL}/tabs/FindBack_Found_Items`,
  IDENTITY_VERIFICATION: `${CONNECTION_URL}/tabs/FindBack_Identity_Verification`,
  NOTIFICATIONS: `${CONNECTION_URL}/tabs/FindBack_Notifications`,
};

export interface BaseFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

/**
 * Centralized base fetch function that injects required headers,
 * stringifies bodies for write requests, and includes robust error logging.
 */
export async function baseFetch(url: string, options: BaseFetchOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': '[https://api.sheetbest.com/sheets/93812d90-9938-4f16-acd9-09b79ed50388]',
    ...(options.headers as Record<string, string> || {}),
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.body !== undefined) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      console.log(`[API Error Log] Fetch failed for ${url}. Status code: ${response.status}`, response);
    }
    return response;
  } catch (error) {
    console.error(`[API Network Error Log] Failed fetching ${url}:`, error);
    throw error;
  }
}
