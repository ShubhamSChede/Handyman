"use client";
import Head from 'next/head';
import WhyChooseUs from '../../components/WhyChooseUs';
import ImageSlider from '../../components/ImageSlider';
import ServiceGrid from '../../components/ServiceGrid';
import ImageGrid from '../../components/ImageGrid';

export default function SearchPage() {
  return (
    <div>
      <div className="min-h-screen bg-white">
        <Head>
          <title>Home Services at your doorstep</title>
          <meta name="description" content="Book home services at your doorstep" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:gap-8">
            {/* Left Column - Service Grid Component */}
            <ServiceGrid />
            
            {/* Right Column - Image Grid Component */}
            <ImageGrid />
          </div>
        </main>
      </div>
      <ImageSlider />
      <WhyChooseUs />
    </div>
  );
}