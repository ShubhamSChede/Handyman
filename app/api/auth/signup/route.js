// app/api/auth/signup/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../../config/dbConfig";
import User from "../../../../models/user.model";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connect();

    // Drop ALL existing indexes and recreate only what we need
    try {
      // Drop all indexes
      await mongoose.connection.collection('users').dropIndexes();
      
      // Recreate only the indexes we need
      await mongoose.connection.collection('users').createIndex({ phoneNumber: 1 }, { unique: true });
      await mongoose.connection.collection('users').createIndex({ location: "2dsphere" });
    } catch (error) {
      console.log("Index operation error:", error);
    }

    const { name, phoneNumber } = await request.json();

    if (!name || !phoneNumber) {
      return NextResponse.json(
        { error: "Name and phone number are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this phone number already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const user = await User.create({
      name,
      phoneNumber
    });

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}