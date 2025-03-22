// app/api/findVendors/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../config/dbConfig";
import User from "../../../models/user.model";

export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const servicesOffered = searchParams.getAll("service");

    if (!servicesOffered.length) {
      return NextResponse.json({ error: "Service parameter required" }, { status: 400 });
    }

    const vendors = await User.find({
      role: "vendor",
      servicesOffered: { $in: servicesOffered },
      isAvailable: true
    });

    if (!vendors.length) {
      return NextResponse.json({ message: "No vendors found" }, { status: 404 });
    }

    return NextResponse.json({ vendors }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}