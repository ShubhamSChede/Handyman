"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    address: "",
    landmark: "",
    latitude: "",
    longitude: "",
    servicesOffered: [],
    pricing: "",
    startTime: "09:00",
    endTime: "17:00",
    serviceInput: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addService = () => {
    if (formData.serviceInput.trim()) {
      setFormData({
        ...formData,
        servicesOffered: [...formData.servicesOffered, formData.serviceInput.trim()],
        serviceInput: ""
      });
    }
  };

  const removeService = (index) => {
    const updatedServices = [...formData.servicesOffered];
    updatedServices.splice(index, 1);
    setFormData({
      ...formData,
      servicesOffered: updatedServices
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setErrorMessage("");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setErrorMessage("Failed to get your location. Please enter coordinates manually.");
          setLoading(false);
        }
      );
    } else {
      setErrorMessage("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!formData.address || !formData.latitude || !formData.longitude || formData.servicesOffered.length === 0 || !formData.pricing) {
      setErrorMessage("All required fields must be filled");
      return;
    }

    try {
      setLoading(true);
      
      const vendorData = {
        address: formData.address,
        landmark: formData.landmark,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        role: "vendor", // Setting role explicitly as vendor
        servicesOffered: formData.servicesOffered,
        pricing: parseFloat(formData.pricing),
        availability: {
          startTime: formData.startTime,
          endTime: formData.endTime
        }
      };

      const response = await fetch("/api/updateUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vendorData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage("Vendor profile created successfully!");
        // Redirect after short delay to allow user to see success message
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMessage(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage("Failed to create vendor profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Register as a Vendor</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Location Information</h2>
          
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
          </div>
          
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Landmark</label>
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Latitude *</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Longitude *</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={getCurrentLocation}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            disabled={loading}
          >
            {loading ? "Getting Location..." : "Get Current Location"}
          </button>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Service Information</h2>
          
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Services Offered *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="serviceInput"
                value={formData.serviceInput}
                onChange={handleChange}
                className="border p-2 rounded flex-grow"
                placeholder="Add a service"
              />
              <button
                type="button"
                onClick={addService}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            
            {formData.servicesOffered.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.servicesOffered.map((service, index) => (
                  <div key={index} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
                    <span>{service}</span>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Pricing (per hour in ₹) *</label>
            <input
              type="number"
              name="pricing"
              value={formData.pricing}
              onChange={handleChange}
              className="border p-2 rounded"
              min="1"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Available From</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Available To</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Register as Vendor"}
        </button>
      </form>
    </div>
  );
}
