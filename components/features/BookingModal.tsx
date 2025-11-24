import React from 'react';
import { X } from 'lucide-react';

const BookingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-50 animate-pulse"></div>
            <h3 className="font-semibold text-gray-800">Schedule Your Discovery Call</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 w-full relative bg-gray-50">
           {/* Loading Spinner underneath iframe */}
           <div className="absolute inset-0 flex items-center justify-center z-0">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
           </div>
           
           <iframe 
             src='https://outlook.office.com/book/TaskClearers1@TaskClearers.com/' 
             width='100%' 
             height='100%' 
             className="relative z-10 w-full h-full"
             style={{ border: 0 }}
             title="Booking Calendar"
           ></iframe>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;