//C:\Users\shubh\Desktop\ishack\uncommited-commiters\frontend\utils\aiRecommendation.js
import { OpenAI } from "openai";

// Using only environment variables, no hardcoded tokens
const token = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const endpoint = process.env.NEXT_PUBLIC_OPENAI_API_ENDPOINT ;
const modelName = process.env.NEXT_PUBLIC_OPENAI_MODEL_NAME ;

/**
 * Get AI recommendation for the best vendor based on the available vendors
 * @param {Array} vendors - List of vendors
 * @param {String} serviceCategory - Service category name
 * @param {Object} userLocation - User location {lat, lng}
 * @returns {Promise<Object>} - Recommendation object with bestVendor and reasoning
 */
export async function getBestVendorRecommendation(vendors, serviceCategory, userLocation) {
  try {
    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return { 
        bestVendor: null, 
        reasoning: "No vendors available for recommendation." 
      };
    }
    
    // Check if API key is available
    if (!token) {
      console.error("OpenAI API key not found in environment variables");
      return {
        bestVendor: null,
        reasoning: "API configuration missing. Please check environment setup."
      };
    }
    
    const client = new OpenAI({ 
      baseURL: endpoint, 
      apiKey: token,
      dangerouslyAllowBrowser: true // Allow usage in browser environment
    });
    
    // Prepare vendor data for the AI to analyze
    const vendorData = vendors.map(vendor => ({
      id: vendor._id || vendor.clerkId,
      name: vendor.name,
      services: vendor.servicesOffered || [],
      pricing: vendor.pricing,
      rating: vendor.reviews && vendor.reviews.length > 0 
        ? (vendor.reviews.reduce((acc, r) => acc + r.rating, 0) / vendor.reviews.length).toFixed(1)
        : "No ratings",
      location: vendor.location && vendor.location.coordinates 
        ? vendor.location.coordinates 
        : null,
      distance: calculateDistance(
        userLocation?.lat, 
        userLocation?.lng,
        vendor.location?.coordinates?.[1], 
        vendor.location?.coordinates?.[0]
      ),
      availability: vendor.availability || "Unknown"
    }));

    // Create a prompt for the AI to analyze and recommend the best vendor
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that can analyze vendor data and recommend the best one based on ratings, distance and service relevance." 
        },
        { 
          role: "user", 
          content: `Please recommend the best vendor for ${serviceCategory} service from the following vendors. Consider factors like rating, distance, and service relevance. Return a JSON object with 'bestVendorId' containing the vendor ID of your recommendation and 'reasoning' with a short explanation of your choice.\n\nVendor data: ${JSON.stringify(vendorData)}` 
        }
      ],
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 500,
      response_format: { type: "json_object" },
      model: modelName
    });

    const result = JSON.parse(response.choices[0].message.content);
    const bestVendor = vendors.find(v => v._id === result.bestVendorId || v.clerkId === result.bestVendorId);
    
    return {
      bestVendor,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error("Error getting AI recommendation:", error);
    return {
      bestVendor: null,
      reasoning: "Unable to generate recommendation at this time."
    };
  }
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "Unknown";
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance.toFixed(1) + " km";
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}