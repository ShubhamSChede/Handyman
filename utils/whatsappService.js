/**
 * Sends a WhatsApp message to a vendor using WhatsApp API
 * @param {string} phoneNumber - The vendor's phone number (include country code)
 * @param {string} message - The message to send
 * @returns {Promise<Response>} - The response from the API call
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Format the phone number correctly
    // Remove any non-numeric characters and ensure it has country code
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }
    
    // Use WhatsApp API to send message
    // This is a direct web API approach that opens WhatsApp
    // For production, you would use WhatsApp Business API with proper authentication
    const url = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
    
    // In a real application, you would make an API call to your backend
    // which would use the official WhatsApp Business API
    // Here we'll simulate this by returning a promise
    
    // For demonstration, we'll open the URL in a new window
    // This is just for testing - in production you'd use a proper API call
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    
    // Return a resolved promise to indicate success
    return Promise.resolve({
      success: true,
      message: "WhatsApp message initiated"
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return Promise.reject(error);
  }
};

/**
 * For a production environment, you would implement a server-side function
 * that uses the WhatsApp Business API with proper authentication.
 * Example of how it would be structured (not implemented here):
 */
export const sendWhatsAppMessageProd = async (phoneNumber, message) => {
  // This would be implemented on the server side
  // The frontend would call your backend API endpoint
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
};
