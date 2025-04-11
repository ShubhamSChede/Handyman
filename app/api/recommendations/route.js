import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { vendors, serviceType, userLocation } = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OpenAI API key in environment variables");
      
      // Return a simple recommendation without using AI
      const bestVendor = findSimpleBestVendor(vendors);
      
      return NextResponse.json({
        bestVendor,
        reasoning: bestVendor 
          ? "Recommended based on rating and availability." 
          : "No suitable vendors found."
      });
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Simplify vendor data to include only what's needed
    const vendorData = vendors.map(v => ({
      id: v._id,
      name: v.name,
      isAvailable: v.isAvailable,
      rating: v.reviews && v.reviews.length > 0 
        ? (v.reviews.reduce((sum, r) => sum + r.rating, 0) / v.reviews.length).toFixed(1) 
        : "No ratings",
      pricing: v.pricing,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        v.location?.coordinates?.[1],
        v.location?.coordinates?.[0]
      )
    }));
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that recommends service providers."
          },
          {
            role: "user",
            content: `Please recommend the best vendor for ${serviceType} service from the following vendors. Consider factors like rating, availability, price, and distance. Return a JSON object with 'bestVendorId' containing the vendor ID of your recommendation and 'reasoning' with a short explanation of your choice.\n\nVendor data: ${JSON.stringify(vendorData)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });
      
      let result;
      try {
        result = JSON.parse(response.choices[0].message.content);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        throw new Error("Invalid response from AI");
      }
      
      const bestVendor = vendors.find(v => v._id === result.bestVendorId);
      
      return NextResponse.json({
        bestVendor: bestVendor || null,
        reasoning: result.reasoning
      });
      
    } catch (aiError) {
      console.error("AI recommendation failed:", aiError);
      
      // Fallback to simple recommendation
      const bestVendor = findSimpleBestVendor(vendors);
      
      return NextResponse.json({
        bestVendor,
        reasoning: bestVendor 
          ? "Recommended based on rating and availability." 
          : "No suitable vendors found."
      });
    }
    
  } catch (error) {
    console.error("Recommendation API error:", error);
    return NextResponse.json({ 
      error: "Failed to generate recommendation",
      bestVendor: null,
      reasoning: "Error generating recommendation." 
    }, { status: 500 });
  }
}

// Helper function to find the best vendor without AI
function findSimpleBestVendor(vendors) {
  if (!vendors || !vendors.length) return null;
  
  // Prioritize available vendors with ratings
  const availableVendors = vendors.filter(v => v.isAvailable);
  const vendorsToUse = availableVendors.length > 0 ? availableVendors : vendors;
  
  // Find vendors with ratings
  const vendorsWithRatings = vendorsToUse.filter(v => 
    v.reviews && v.reviews.length > 0
  );
  
  if (vendorsWithRatings.length > 0) {
    // Return highest rated vendor
    return vendorsWithRatings.sort((a, b) => {
      const aRating = a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length;
      const bRating = b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length;
      return bRating - aRating;
    })[0];
  }
  
  // If no vendors with ratings, return first available
  return vendorsToUse[0];
}

// Calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "Unknown";
  
  const R = 6371; // Radius of Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;
  
  return distance.toFixed(1) + " km";
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}