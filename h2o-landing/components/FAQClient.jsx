'use client';

import { useState } from 'react';

export default function FAQClient({ items }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => toggleAccordion(idx)}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-semibold text-gray-900 text-left">{item.question}</span>
              <span className={`text-blue-600 text-2xl transition-transform ${activeIndex === idx ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>

            {activeIndex === idx && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
