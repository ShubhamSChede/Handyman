import Image from 'next/image';

const ImageGrid = () => {
  return (
    <div className="md:w-1/2">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* First row - larger images */}
        <div className="relative h-[40vh]">
          <Image
            src="/displayimage1.jpg"
            alt="Service professional giving consultation"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg object-cover"
            priority
          />
        </div>
        <div className="relative h-[40vh]">
          <Image
            src="/displayimage2.jpg"
            alt="Professional massage service"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg object-cover"
          />
        </div>
        {/* Second row - smaller images */}
        <div className="relative h-[30vh]">
          <Image
            src="/displayimage3.jpg"
            alt="Home repair service"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg object-cover"
          />
        </div>
        <div className="relative h-[30vh]">
          <Image
            src="/displayimage4.jpg"
            alt="AC maintenance service"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageGrid;