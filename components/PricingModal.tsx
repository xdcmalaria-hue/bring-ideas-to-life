/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tiers = [
    {
      name: 'Hobby',
      price: '$0',
      description: 'For personal projects and experiments.',
      features: ['3 generations per day', 'Standard generation speed', 'Public creations', 'Community support'],
      cta: 'Current Plan',
      current: true
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For power users who need more capabilities.',
      features: ['Unlimited generations', 'Fast generation speed', 'Private creations', 'Priority support', 'Export to React/HTML'],
      cta: 'Upgrade to Pro',
      highlight: true
    },
    {
      name: 'Team',
      price: '$49',
      period: '/month',
      description: 'For teams collaborating on projects.',
      features: ['Everything in Pro', 'Team shared workspace', 'Admin controls', 'SSO', 'Custom contracts'],
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
       <div 
        className="bg-white dark:bg-[#0E0E10] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl p-6 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-3">Simple, transparent pricing</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Choose the plan that's right for you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`relative rounded-xl border p-6 flex flex-col ${
                tier.highlight 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{tier.name}</h3>
                <div className="mt-2 flex items-baseline text-zinc-900 dark:text-white">
                  <span className="text-3xl font-bold tracking-tight">{tier.price}</span>
                  {tier.period && <span className="ml-1 text-sm font-medium text-zinc-500">{tier.period}</span>}
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 h-10">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className={`w-5 h-5 flex-shrink-0 mr-2 ${tier.highlight ? 'text-blue-500' : 'text-zinc-400'}`} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  tier.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : tier.current
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default border border-zinc-200 dark:border-zinc-700'
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
                disabled={tier.current}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
       <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};