import { NextResponse } from "next/server";

const instructions = `
You are a helpful AI assistant for a service booking platform. Your main tasks:
- Help users **navigate the app** by giving step-by-step instructions.
- Explain how to **book services, update profiles, and make payments**.
- Answer common questions about **pricing, vendor verification, and refunds**.

Examples:
User: "How do I book a service?"
Bot: "Go to the homepage > Select a service > Choose a vendor > Pick a time slot > Click 'Book Now'."

User: "Where can I see my bookings?"
Bot: "Go to 'My Profile' > Click on 'Bookings' to see your confirmed services."
`;

export async function POST(req) {
  try {
    const { message } = await req.json();

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3", prompt: `${instructions}\nUser: ${message}\nBot:` }),
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.response });
  } catch (error) {
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}
