// ImageSlider.js
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slidesRef = useRef([]);
  const sliderRef = useRef(null);
  
  // Array of images with captions
  const slides = [
    {
      image: '/slider1.jpg',
      title: 'Professional Home Repairs',
      subtitle: 'Quality workmanship for every project'
    },
    {
      image: '/slider2.jpg',
      title: 'Expert Installations',
      subtitle: 'From fixtures to appliances, done right the first time'
    },
    {
      image: '/slider3.jpg',
      title: 'Home Improvement',
      subtitle: 'Transform your living space with our skilled craftsmen'
    },
    {
      image: '/slider4.jpg',
      title: 'Emergency Services',
      subtitle: 'Fast response when you need it most'
    }
  ];

  // Add overlay gradient effect
  useEffect(() => {
    // Initial animation for the first slide
    if (slidesRef.current.length > 0) {
      animateSlideContent(0);
    }
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        const nextSlide = (currentSlide + 1) % slides.length;
        changeSlide(nextSlide);
      }
    }, 6000); // Change slide every 6 seconds
    
    return () => clearInterval(interval);
  }, [currentSlide, isAnimating, slides.length]);

  const animateSlideContent = (index) => {
    if (!slidesRef.current[index]) return;
    
    const titleElement = slidesRef.current[index].querySelector('.slide-title');
    const subtitleElement = slidesRef.current[index].querySelector('.slide-subtitle');
    const ctaButton = slidesRef.current[index].querySelector('.slide-cta');
    
    const timeline = gsap.timeline();
    
    timeline
      .fromTo(titleElement, 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      )
      .fromTo(subtitleElement, 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 
        "-=0.6"
      )
      .fromTo(ctaButton, 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 
        "-=0.6"
      );
  };

  const changeSlide = (newIndex) => {
    if (currentSlide === newIndex || isAnimating) return;
    
    setIsAnimating(true);
    
    // Fade out current slide content
    const currentContent = slidesRef.current[currentSlide].querySelectorAll('.slide-content > *');
    
    gsap.to(currentContent, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      stagger: 0.1,
      onComplete: () => {
        // Change slides with opacity transition
        gsap.to(slidesRef.current[currentSlide], {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            setCurrentSlide(newIndex);
            
            // Fade in new slide
            gsap.fromTo(slidesRef.current[newIndex], 
              { opacity: 0 }, 
              { 
                opacity: 1, 
                duration: 0.5,
                onComplete: () => {
                  animateSlideContent(newIndex);
                  setIsAnimating(false);
                }
              }
            );
          }
        });
      }
    });
  };

  // Go to previous slide
  const prevSlide = () => {
    if (!isAnimating) {
      const prevIndex = (currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
      changeSlide(prevIndex);
    }
  };

  // Go to next slide
  const nextSlide = () => {
    if (!isAnimating) {
      const nextIndex = (currentSlide === slides.length - 1 ? 0 : currentSlide + 1);
      changeSlide(nextIndex);
    }
  };

  // Go to specific slide
  const goToSlide = (index) => {
    if (!isAnimating && index !== currentSlide) {
      changeSlide(index);
    }
  };

  const addToSlidesRef = (el) => {
    if (el && !slidesRef.current.includes(el)) {
      slidesRef.current.push(el);
    }
  };

  return (
    <div ref={sliderRef} className="relative w-full h-[70vh] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          ref={(el) => addToSlidesRef(el)}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={`Slide ${index + 1}`}
            fill
            sizes="100vw"
            quality={90}
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            priority={index === 0}
          />
          
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
          
          {/* Slide content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white slide-content">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 slide-title">{slide.title}</h2>
            <p className="text-lg md:text-xl mb-6 max-w-md slide-subtitle">{slide.subtitle}</p>
            <button className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-md font-medium transition-all duration-300 slide-cta">
              Learn More
            </button>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 z-10"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 z-10"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-100 w-8' 
                : 'bg-white/50 hover:bg-white/70 scale-90'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;