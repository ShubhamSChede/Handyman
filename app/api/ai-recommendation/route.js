import { OpenAI } from "openai";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { vendors, serviceCategory, userLocation } = await request.json();
    
    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json({ 
        bestVendor: null, 
        reasoning: "No vendors available for recommendation." 
      });
    }
    
    const client = new OpenAI({ 
      baseURL: process.env.OPENAI_API_ENDPOINT || "https://models.inference.ai.azure.com", 
      apiKey: process.env.OPENAI_API_KEY
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
          content: "You are a helpful assistant that can analyze vendor data and recommend the best one based on ratings, distance, pricing, and service relevance." 
        },
        { 
          role: "user", 
          content: `Please recommend the best vendor for ${serviceCategory} service from the following vendors. Consider factors like rating, price, distance, and service relevance. Return a JSON object with 'bestVendorId' containing the vendor ID of your recommendation and 'reasoning' with a short explanation of your choice.\n\nVendor data: ${JSON.stringify(vendorData)}` 
        }
      ],
      temperature: 0.5,
      top_p: 1.0,
      max_tokens: 500,
      response_format: { type: "json_object" },
      model: process.env.OPENAI_MODEL_NAME || "gpt-4o"
    });

    const result = JSON.parse(response.choices[0].message.content);
    const bestVendor = vendors.find(v => v._id === result.bestVendorId || v.clerkId === result.bestVendorId);
    
    return NextResponse.json({
      bestVendor,
      reasoning: result.reasoning
    });
  } catch (error) {
    console.error("Error getting AI recommendation:", error);
    return NextResponse.json({
      bestVendor: null,
      reasoning: "Unable to generate recommendation at this time."
    }, { status: 500 });
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
