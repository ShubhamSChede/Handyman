// In your LoginUser component (loginuser/[[...rest]]/page.js)
"use client"

import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export default function LoginUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Add a console.log to debug
    console.log("Auth state:", { isSignedIn, isLoaded });
    
    if (isLoaded && isSignedIn) {
      console.log("Redirecting to location page");
      router.push('/location');
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md">
        <SignUp routing="path" path="/loginuser" redirectUrl="/location" />
      </div>
    </div>
  );
}