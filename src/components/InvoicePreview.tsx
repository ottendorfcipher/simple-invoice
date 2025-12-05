'use client';

import React from 'react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Customer {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Company {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  logo?: string;
}

interface InvoicePreviewProps {
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  footerMessage?: string;
  customer: Customer;
  company: Company;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  isTaxFree: boolean;
  hasConvenienceFee: boolean;
  convenienceFee: number;
  hasSurcharge: boolean;
  surchargePercentage: number;
}

// Helper function to format date as MM-DD-YYYY
function formatDate(dateString: string): string {
  if (!dateString) return '';
  // Parse date string directly to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${month}-${day}-${year}`;
}

export default function InvoicePreview({
  invoiceNumber,
  status,
  issueDate,
  dueDate,
  currency,
  notes,
  footerMessage,
  customer,
  company,
  lineItems,
  subtotal,
  tax,
  total,
  taxRate,
  isTaxFree,
  hasConvenienceFee,
  convenienceFee,
  hasSurcharge,
  surchargePercentage,
}: InvoicePreviewProps) {
  const surcharge = subtotal * (surchargePercentage / 100);
  const calculatedTax = isTaxFree ? 0 : (subtotal + surcharge + convenienceFee) * (taxRate / 100);

  return (
    <div className="bg-white text-gray-800 font-sans text-sm leading-relaxed max-w-4xl mx-auto p-16 min-h-[297mm]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Logo */}
      {company.logo && (
        <div className="absolute top-8 left-16">
          <img 
            src={company.logo} 
            alt="Company Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
      )}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-thin text-gray-800 tracking-widest mb-8">Invoice</h1>
      </div>
      
      {/* Company Info */}
      <div className="text-center mb-8 pb-5 border-b border-gray-300">
        <div className="text-lg font-bold text-gray-800 mb-1">
          {company.name || 'Your Company'}
        </div>
        {company.address && (
          <div className="text-xs text-gray-500 mb-1">{company.address}</div>
        )}
        {(company.city || company.state || company.postalCode) && (
          <div className="text-xs text-gray-500 mb-1">
            {[company.city, company.state, company.postalCode].filter(Boolean).join(', ')}
          </div>
        )}
        {company.email && (
          <div className="text-xs text-gray-500 mb-1">{company.email}</div>
        )}
      </div>
      
      {/* Invoice Details */}
      <div className="flex justify-between mb-6 pb-4 border-b border-gray-300">
        <div className="w-1/2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bill To</div>
          <div className="text-sm font-bold text-gray-800 mb-1">
            {customer.name || 'Customer Name'}
          </div>
          {customer.address && (
            <div className="text-xs text-gray-500 mb-1">{customer.address}</div>
          )}
          {customer.email && (
            <div className="text-xs text-gray-500 mb-1">{customer.email}</div>
          )}
        </div>
        
        <div className="w-1/2 text-right">
          <div className="text-sm text-gray-800 mb-2">{invoiceNumber}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 whitespace-nowrap">Invoice Date</div>
          <div className="text-sm text-gray-800 mb-2">{formatDate(issueDate)}</div>
          {dueDate && (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Due Date</div>
              <div className="text-sm text-gray-800 mb-2">{formatDate(dueDate)}</div>
            </>
          )}
        </div>
      </div>
      
      {/* Items Section */}
      <div className="mb-6">
        <div className="text-sm font-bold text-gray-800 mb-4">Items</div>
        
        {/* Items Header */}
        <div className="flex border-b border-gray-100 pb-2 mb-2">
          <div className="w-1/2 text-xs text-gray-500 uppercase">Description</div>
          <div className="w-1/6 text-xs text-gray-500 uppercase text-center">Qty</div>
          <div className="w-1/6 text-xs text-gray-500 uppercase text-right">Rate</div>
          <div className="w-1/6 text-xs text-gray-500 uppercase text-right">Amount</div>
        </div>
        
        {/* Line Items */}
        {lineItems.map((item, index) => (
          <div key={index} className="flex py-2 border-b border-gray-100">
            <div className="w-1/2 text-sm text-gray-800">{item.description || ''}</div>
            <div className="w-1/6 text-sm text-gray-500 text-center">{item.quantity || 0}</div>
            <div className="w-1/6 text-sm text-gray-500 text-right">${(item.rate || 0).toFixed(2)}</div>
            <div className="w-1/6 text-sm text-gray-800 text-right font-medium">${(item.amount || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
      
      {/* Totals Section */}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="space-y-2">
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="text-sm text-gray-800">${subtotal.toFixed(2)}</span>
          </div>
          
          {hasConvenienceFee && convenienceFee > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-500">Convenience Fee</span>
              <span className="text-sm text-gray-800">${convenienceFee.toFixed(2)}</span>
            </div>
          )}
          
          {hasSurcharge && surchargePercentage > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-500">Surcharge ({surchargePercentage}%)</span>
              <span className="text-sm text-gray-800">${surcharge.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-500">Tax</span>
            <span className="text-sm text-gray-800">
              {isTaxFree ? 'Free' : `$${calculatedTax.toFixed(2)}`}
            </span>
          </div>
          
          <div className="flex justify-between py-2 mt-2 pt-2 border-t border-gray-300">
            <span className="text-base font-bold text-gray-800">Total</span>
            <span className="text-base font-bold text-gray-800">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes Section */}
      {notes && (
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</div>
          <div className="text-xs text-gray-800 leading-relaxed">{notes}</div>
        </div>
      )}
      
      {/* Footer */}
      {footerMessage && (
        <div className="mt-10 text-center text-xs text-gray-500">
          {footerMessage}
        </div>
      )}
    </div>
  );
}
