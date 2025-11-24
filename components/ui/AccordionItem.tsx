import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const AccordionItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        className="w-full py-6 flex items-center justify-between text-left hover:text-green-600 transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-lg pr-4 text-gray-800 group-hover:text-green-700">{question}</span>
        <div className={`p-2 rounded-full bg-gray-50 group-hover:bg-green-50 transition-all duration-300 ${isOpen ? 'rotate-45 text-green-600' : 'text-gray-400'}`}>
          <Plus size={20} />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-gray-600 leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
};

export default AccordionItem;