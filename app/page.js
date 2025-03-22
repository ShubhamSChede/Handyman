'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import WhyChooseUs from '../components/WhyChooseUs'
import ImageSlider from '../components/ImageSlider'

const Page = () => {
  // Refs for GSAP animations
  const heroRef = useRef(null)
  const servicesRef = useRef(null)
  const ctaRef = useRef(null)
  const statsRef = useRef(null)
  
  // State to track login status
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check login status when component mounts
  useEffect(() => {
    // Safe way to access localStorage (only on client side)
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(storedLoginStatus === 'true');
  }, []);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin)
    
    // Hero section animations with a timeline
    const heroTl = gsap.timeline({
      defaults: { ease: "power3.out" }
    })
    
    heroTl
      .fromTo(
        ".hero-badge", 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.6 }
      )
      .fromTo(
        ".hero-title", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8 }
      )
      .fromTo(
        ".hero-description", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8 }, 
        "-=0.6"
      )
      .fromTo(
        ".hero-button", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, stagger: 0.2, duration: 0.6 },
        "-=0.6"
      )
    
    // Stats section animations
    if (statsRef.current) {
      // Counter animations
      const statsElements = statsRef.current.querySelectorAll('.stat-number');
      statsElements.forEach(stat => {
        const target = parseFloat(stat.getAttribute('data-target'));
        
        ScrollTrigger.create({
          trigger: statsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.to(stat, {
              duration: 2,
              textContent: target,
              roundProps: "textContent",
              ease: "power1.inOut"
            });
          },
          once: true
        });
      });
      
      // Fade in stats section
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%",
          }
        }
      );
    }
    
    // CTA section animation
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
          }
        }
      );
    }
    
    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  // Function to handle button click based on login status
  const handleExploreClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault(); // Prevent default link behavior
      window.location.href = '/login';
    }
    // If logged in, let the link handle navigation to /search
  }

  return (
    <div className="overflow-hidden">
      <ImageSlider />
      
      {/* Hero Section */}
      <section className="py-24 bg-white">
        <div ref={heroRef} className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium inline-block mb-5 hero-badge">
              Find Local Professionals
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight hero-title">
              Connecting You to <span className="relative inline-block">
                <span className="relative z-10">Local Service</span>
                
              </span> Professionals
            </h2>
            <p className="text-xl text-gray-700 mb-10 leading-relaxed hero-description">
              We bring local service businesses like plumbing, carpentry, electrical work, and more directly to customers who need them.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              {/* Dynamically set href based on login status */}
              <Link href={isLoggedIn ? "/search" : "/login"}>
                <button className="bg-black hover:bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 hero-button cursor-pointer">
                  Explore Services
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <h3 className="text-4xl font-bold text-black mb-2">
                <span className="stat-number" data-target="500">0</span>+
              </h3>
              <p className="text-gray-700">Service Providers</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <h3 className="text-4xl font-bold text-black mb-2">
                <span className="stat-number" data-target="15000">0</span>+
              </h3>
              <p className="text-gray-700">Happy Customers</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <h3 className="text-4xl font-bold text-black mb-2">
                <span className="stat-number" data-target="25">0</span>+
              </h3>
              <p className="text-gray-700">Service Categories</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <h3 className="text-4xl font-bold text-black mb-2">
                <span className="stat-number" data-target="98">0</span>%
              </h3>
              <p className="text-gray-700">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us Section */}
      <WhyChooseUs />
      
      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-black text-white rounded-2xl p-12 md:p-16 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
            
            <div className="max-w-2xl relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to find the perfect service professional?</h2>
              <p className="text-lg mb-8 text-gray-300">Join thousands of satisfied customers who found reliable, skilled professionals through our platform.</p>
              <div className="flex flex-wrap gap-4">
                <Link href={isLoggedIn ? "/search" : "/loginuser"}>
                  <button className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:-translate-y-1">
                    Get Started Now
                  </button>
                </Link>
                <Link href={isLoggedIn ? "/search" : "/services"}>
                  <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:-translate-y-1">
                    Explore Services
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Page