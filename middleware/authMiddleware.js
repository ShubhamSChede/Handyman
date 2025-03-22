// middleware/authMiddleware.js
import { NextResponse } from "next/server";
import User from "../models/user.model";

export async function authenticateUser(request) {
  try {
    const phoneNumber = request.headers.get('x-phone-number');
    
    if (!phoneNumber) {
      return { error: "Phone number required", status: 401 };
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return { error: "User not found", status: 401 };
    }

    return { userId: user._id, status: 200 };
  } catch (error) {
    return { error: "Authentication failed", status: 401 };
  }
}