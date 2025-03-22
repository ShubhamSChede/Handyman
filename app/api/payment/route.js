import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req) {
  const { amount, orderId } = await req.json();

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
  });

  const options = {
    amount: amount * 100, 
    currency: "INR",
    receipt: orderId,
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    return NextResponse.json({ razorpayKey: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: options.amount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
