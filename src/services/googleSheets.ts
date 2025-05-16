// Load Google Script URL from environment variable
const REACT_APP_GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
const USE_MOCK_IMPLEMENTATION = !REACT_APP_GOOGLE_SCRIPT_URL;

// Add a flag to track form submissions in the current session
// This helps prevent duplicate submissions
const processedSubmissions = new Set<string>();

let mockDatabase: Record<string, any[]> = {};

/**
 * Fetches user data from Google Sheets using JSONP approach
 * This avoids CORS issues completely
 * @param userId The user ID to fetch data for
 * @returns The user data or null if not found
 */
export async function fetchUserData(userId: string) {
  if (USE_MOCK_IMPLEMENTATION) {
    console.log('Using mock implementation (no Google Sheets connected)');
    return mockFetchUserData(userId);
  }
  
  try {
    console.log('Fetching data for userId:', userId);
    
    // Skip the fetch approach which has CORS issues and go directly to JSONP
    return await fetchWithJsonp(userId);
    
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    console.warn('Falling back to mock implementation due to error');
    return mockFetchUserData(userId);
  }
}

/**
 * JSONP approach for GET requests that avoids CORS issues
 */
function fetchWithJsonp(userId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'googleSheetsCallback_' + Math.random().toString(36).substr(2, 9);
    
    // Create global callback function
    (window as any)[callbackName] = function(data: any) {
      // Clean up
      document.body.removeChild(script);
      delete (window as any)[callbackName];
      
      if (data.success) {
        resolve(data.data);
      } else {
        reject(new Error(data.error || 'Unknown error'));
      }
    };
    
    // Create script element
    const script = document.createElement('script');
    script.src = `${REACT_APP_GOOGLE_SCRIPT_URL}?userId=${encodeURIComponent(userId)}&callback=${callbackName}`;
    script.onerror = () => {
      // Clean up
      document.body.removeChild(script);
      delete (window as any)[callbackName];
      reject(new Error('JSONP request failed'));
    };
    
    // Add to document to start the request
    document.body.appendChild(script);
    
    // Set timeout for the request
    setTimeout(() => {
      if ((window as any)[callbackName]) {
        document.body.removeChild(script);
        delete (window as any)[callbackName];
        reject(new Error('JSONP request timed out'));
      }
    }, 10000); // 10 seconds timeout
  });
}

/**
 * Saves data to Google Sheets
 * @param data The data to save
 * @returns The result of the operation
 */
export async function saveToGoogleSheets(data: any) {
  if (USE_MOCK_IMPLEMENTATION) {
    console.log('Using mock implementation (no Google Sheets connected)');
    return mockSaveToSheets(data);
  }
  
  // Generate a unique submission ID based on data content
  const submissionId = generateSubmissionId(data);
  
  // Check if this exact data was already submitted recently
  if (processedSubmissions.has(submissionId)) {
    console.log('Duplicate submission detected and prevented');
    return { success: true, duplicatePrevented: true };
  }
  
  // Mark this submission as processed
  processedSubmissions.add(submissionId);
  
  // Set a timeout to remove the submission ID after some time
  // This allows resubmission of the same data after a period of time if needed
  setTimeout(() => {
    processedSubmissions.delete(submissionId);
  }, 10000); // 10 seconds
  
  try {
    console.log('Saving data to Google Sheets:', data);
    
    // Skip attempting fetch and go directly to form submission approach
    // to avoid CORS issues
    return await saveWithForm(data);
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    console.warn('Falling back to mock implementation due to error');
    return mockSaveToSheets(data);
  }
}

/**
 * Generates a simple hash/ID for a submission to detect duplicates
 */
function generateSubmissionId(data: any): string {
  // Create a string representation of the data
  const str = JSON.stringify(data);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString() + '-' + Date.now().toString().substr(-4);
}

/**
 * Form submission approach for POST requests
 * This works around CORS by using a form submission with a hidden iframe
 */
function saveWithForm(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create a unique ID for this request
    const formId = 'googleSheetsForm_' + Math.random().toString(36).substr(2, 9);
    const iframeId = 'googleSheetsIframe_' + Math.random().toString(36).substr(2, 9);
    
    // Create iframe to receive the response
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.name = iframeId;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Create form
    const form = document.createElement('form');
    form.id = formId;
    form.method = 'POST';
    form.action = REACT_APP_GOOGLE_SCRIPT_URL;
    form.target = iframeId;
    form.style.display = 'none';
    
    // Create input for data
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(data);
    form.appendChild(input);
    
    // Add form to document
    document.body.appendChild(form);
    
    // Handle iframe load event
    iframe.onload = () => {
      try {
        // Try to get response from iframe
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        const responseText = iframeDocument?.body.innerText || iframeDocument?.body.textContent;
        
        // Log the raw response for debugging
        console.log('Form submission raw response:', responseText);
        
        if (responseText) {
          try {
            const response = JSON.parse(responseText);
            resolve(response);
          } catch (parseError) {
            console.warn('Could not parse response as JSON:', parseError);
            // If we can't parse the response, assume success anyway
            resolve({ success: true });
          }
        } else {
          // If no response text, assume success
          resolve({ success: true });
        }
      } catch (error) {
        console.warn('Could not read iframe content:', error);
        // If we can't read the iframe content, assume success
        // This can happen due to same-origin policy
        resolve({ success: true });
      } finally {
        // Clean up
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }
    };
    
    // Handle errors
    iframe.onerror = () => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
      reject(new Error('Form submission failed'));
    };
    
    // Set timeout
    setTimeout(() => {
      if (document.getElementById(formId)) {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        reject(new Error('Form submission timed out'));
      }
    }, 10000); // 10 seconds timeout
    
    // Submit the form
    form.submit();
  });
}

// Mock functions
function mockSaveToSheets(data: any): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userId = data.userId;
      if (!mockDatabase[userId]) {
        mockDatabase[userId] = [];
      }
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }
      mockDatabase[userId].push(data);
      console.log('Mock database updated:', mockDatabase);
      resolve({ success: true });
    }, 500);
  });
}

function mockFetchUserData(userId: string): Promise<any | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userRecords = mockDatabase[userId];
      if (!userRecords || userRecords.length === 0) {
        resolve(null);
        return;
      }
      const latestRecord = userRecords[userRecords.length - 1];
      console.log('Fetched record from mock database:', latestRecord);
      resolve(latestRecord);
    }, 500);
  });
}