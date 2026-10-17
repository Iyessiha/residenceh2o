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
              <span className="text-lg font-semibold text-left" style={{ color: 'var(--text)' }}>{item.question}</span>
              <span
                className={`text-2xl transition-transform ${activeIndex === idx ? 'rotate-45' : ''}`}
                style={{ color: 'var(--primary)' }}
              >
                +
              </span>
            </button>

            {activeIndex === idx && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="leading-relaxed" style={{ color: 'var(--text-2)' }}>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
