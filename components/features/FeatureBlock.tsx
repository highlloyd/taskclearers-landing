import React from 'react';

const FeatureBlock = ({ title, description, image, imagePosition = 'right', tags = [] }: any) => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 mb-24 last:mb-0">
      <div className={`w-full lg:w-1/2 ${imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
          <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
          <img src={image} alt={title} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
        </div>
      </div>
      <div className={`w-full lg:w-1/2 ${imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
        <h3 className="text-3xl font-bold mb-4 text-gray-900">{title}</h3>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-100">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureBlock;