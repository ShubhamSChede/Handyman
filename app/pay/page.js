"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { sendWhatsAppMessage } from '../../utils/whatsappService';
import { useRouter } from 'next/navigation';

const PaymentPage = () => {
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [cartItems, setCartItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  const upiId = "3011adinaik@oksbi";
  const name = "Adi Naik";
  const note = "service charge";
  
  useEffect(() => {
    // Retrieve total and cart items from localStorage
    const savedTotal = localStorage.getItem("cartTotal");
    const savedCartItems = localStorage.getItem("cartItems");
    
    if (savedTotal) {
      try {
        setTotal(parseFloat(savedTotal));
      } catch (e) {
        console.error("Error parsing saved total:", e);
      }
    }
    
    if (savedCartItems) {
      try {
        setCartItems(JSON.parse(savedCartItems));
      } catch (e) {
        console.error("Error parsing cart items:", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Group items by vendor
      const vendorMap = {};
      cartItems.forEach(item => {
        if (!vendorMap[item.vendorId]) {
          vendorMap[item.vendorId] = {
            vendorId: item.vendorId,
            vendorName: item.vendorName,
            phoneNumber: item.vendorPhone, // This should be added when adding to cart
            items: []
          };
        }
        vendorMap[item.vendorId].items.push(item);
      });

      // Send WhatsApp message to each vendor
      for (const vendorId in vendorMap) {
        const vendor = vendorMap[vendorId];
        if (vendor.phoneNumber) {
          const itemsList = vendor.items.map(item => `${item.name} (₹${item.cost})`).join(", ");
          const message = `New booking received from ${localStorage.getItem("userName") || "Customer"}: ${itemsList}. Total amount: ₹${total.toFixed(2)}. Payment method: ${selectedPayment.toUpperCase()}`;
          
          await sendWhatsAppMessage(vendor.phoneNumber, message);
        }
      }

      // Clear cart after successful payment
      localStorage.removeItem("cartItems");
      localStorage.removeItem("cartTotal");
      
      // Show success and redirect
      alert("Payment processed successfully! Vendors have been notified.");
      router.push('/confirmation');
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("There was an issue processing your payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPayment(method);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading payment details...</p>
      </div>
    );
  }

  // Generate UPI URL with the actual total amount
  const upiUrl = `upi://pay?pa=${upiId}&pn=${name}&mc=1234&tid=1234567890&tr=1234567890&tn=${note}&am=${total.toFixed(2)}&cu=INR`;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-lg font-bold">₹{total.toFixed(2)}</span>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <form onSubmit={handlePayment}>
          <div className="space-y-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="upi" 
                  name="paymentMethod" 
                  className="mr-3" 
                  defaultChecked 
                  onChange={() => handlePaymentMethodChange('upi')}
                />
                <label htmlFor="upi" className="flex-1">
                  <div className="font-medium">UPI</div>
                  <div className="text-sm text-gray-600">Pay using UPI apps like Google Pay, PhonePe, etc.</div>
                </label>
              </div>
              
              {selectedPayment === 'upi' && (
                <div className="mt-4 flex flex-col items-center p-4 border-t">
                  <div className="text-center mb-2">Scan this QR code to pay</div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <QRCodeSVG value={upiUrl} size={180} />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>UPI ID: {upiId}</p>
                    <p className="mt-1">Amount: ₹{total.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-4 flex items-center">
              <input 
                type="radio" 
                id="card" 
                name="paymentMethod" 
                className="mr-3" 
                onChange={() => handlePaymentMethodChange('card')}
              />
              <label htmlFor="card" className="flex-1">
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-sm text-gray-600">Pay securely using your card</div>
              </label>
            </div>
            
            <div className="border rounded-lg p-4 flex items-center">
              <input 
                type="radio" 
                id="cod" 
                name="paymentMethod" 
                className="mr-3" 
                onChange={() => handlePaymentMethodChange('cod')}
              />
              <label htmlFor="cod" className="flex-1">
                <div className="font-medium">Cash on Delivery</div>
                <div className="text-sm text-gray-600">Pay when service is completed</div>
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
          </button>
        </form>
      </div>
      
      <button 
        onClick={() => window.history.back()}
        className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium"
        disabled={isProcessing}
      >
        Back to Cart
      </button>
    </div>
  );
};

export default PaymentPage;