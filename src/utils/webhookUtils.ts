/**
 * Utility functions for sending data to webhooks
 */

/**
 * Send data to a webhook URL and wait for the response
 * @param url The webhook URL
 * @param data The data to send
 * @returns Promise that resolves with the webhook response
 */
export const sendToWebhook = async (url: string, data: any): Promise<any> => {
  try {
    // Ensure URL has the /ai suffix for the API endpoint
    const apiUrl = url.endsWith('/ai') ? url : `${url}/ai`;
    
    console.log('Sending data to webhook:', apiUrl, data);
    
    // Add timeout to fetch to prevent indefinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new Error(`Webhook HTTP error: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }
    
    // Try to parse the response as JSON
    try {
      const responseData = await response.json();
      console.log('Webhook response received:', responseData);
      return responseData;
    } catch (parseError) {
      console.warn('Could not parse webhook response as JSON:', parseError);
      // Return a default response structure to prevent downstream errors
      return {
        insights: null,
        clientEmotion: null,
        clientInterest: null,
        callStage: null,
        aiCoachingSuggestion: null
      };
    }
  } catch (error) {
    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      console.error('Webhook request timed out after 10 seconds');
      throw new Error('Webhook request timed out after 10 seconds');
    }
    
    console.error('Failed to send data to webhook:', error);
    throw error;
  }
}; 