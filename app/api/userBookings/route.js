// app/api/userBookings/route.js
import { NextResponse } from "next/server";
import { connect } from "../../../config/dbConfig";
import User from "../../../models/user.model";
import Booking from "../../../models/booking.model";
import { authenticateUser } from "../../../middleware/authMiddleware";

export async function GET(request) {
    try {
        await connect();
        const auth = await authenticateUser(request);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const user = await User.findById(auth.userId);
        let bookings;
        if (user.role === "vendor") {
            bookings = await Booking.find({ vendorId: user._id });
        } else {
            bookings = await Booking.find({ userId: user._id });
        }

        return NextResponse.json(bookings, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
