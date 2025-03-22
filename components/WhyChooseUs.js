// WhyChooseUs.js
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const WhyChooseUs = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Title animation
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: -50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
        }
      }
    );

    // Cards animation with stagger
    gsap.fromTo(
      cardRefs.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const reasons = [
    {
      title: "Professional Expertise",
      description: "Our handymen are fully licensed, insured, and backed by years of professional experience in all types of home repairs and improvements.",
      icon: "🔧"
    },
    {
      title: "On-Time Service",
      description: "We respect your time. Our team arrives within the scheduled window and completes projects efficiently without sacrificing quality.",
      icon: "⏱️"
    },
    {
      title: "Satisfaction Guaranteed",
      description: "Every job comes with our satisfaction guarantee. If you're not 100% satisfied, we'll make it right at no additional cost.",
      icon: "✅"
    },
    {
      title: "Transparent Pricing",
      description: "No hidden fees or surprise charges. We provide detailed quotes before beginning any work, so you know exactly what to expect.",
      icon: "💰"
    },
    {
      title: "Vetted Professionals",
      description: "Every handyman on our platform undergoes rigorous background checks and skills assessment before joining our network.",
      icon: "🛡️"
    },
    {
      title: "One-Stop Solution",
      description: "From minor repairs to major renovations, our versatile team handles it all, eliminating the need to hire multiple contractors.",
      icon: "🏠"
    }
  ];

  const addToRefs = (el) => {
    if (el && !cardRefs.current.includes(el)) {
      cardRefs.current.push(el);
    }
  };

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gray-100 rounded-full opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-100 rounded-full opacity-50 translate-x-1/3 translate-y-1/3"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div 
          ref={titleRef}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-5">Why Choose Our Handyman Services</h2>
          <div className="w-24 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            We pride ourselves on delivering exceptional service that goes beyond your expectations.
            Here's why homeowners consistently choose us for their repair and maintenance needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {reasons.map((reason, index) => (
            <div 
              key={index}
              ref={addToRefs}
              className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 group"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  y: -10,
                  duration: 0.3,
                  ease: "power2.out"
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  y: 0,
                  duration: 0.3,
                  ease: "power2.out"
                });
              }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gray-50 border-2 border-black rounded-full flex items-center justify-center text-3xl group-hover:bg-black group-hover:text-white transition-colors duration-300">
                  {reason.icon}
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-black mb-4 text-center">{reason.title}</h3>
              <p className="text-gray-700 text-center leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <button className="bg-black text-white px-8 py-4 rounded-md hover:bg-gray-800 transition-colors duration-300 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Schedule a Service
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;