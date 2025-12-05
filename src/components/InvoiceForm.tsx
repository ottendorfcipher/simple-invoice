'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/db/schema';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import InvoicePreview from '@/components/InvoicePreview';
import { Eye } from 'lucide-react';

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
  logo?: string; // Base64 encoded logo
}

interface InvoiceFormProps {
  invoice?: Invoice;
  isEditing?: boolean;
}

// Sortable line item component - moved outside to prevent recreation
const SortableLineItem = React.memo(({ 
  item, 
  index, 
  isLast, 
  updateLineItem,
  addLineItem,
  removeLineItem,
  lineItemsLength
}: { 
  item: LineItem; 
  index: number; 
  isLast: boolean;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  lineItemsLength: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 gap-4 items-end p-2 rounded-md ${isDragging ? 'bg-gray-100' : 'bg-white'}`}
    >
      {/* Drag Handle */}
      <div className="col-span-1 flex justify-center" style={{ paddingTop: '12px' }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 flex items-center justify-center h-8 w-8"
          title="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 6a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </button>
      </div>
      
      {/* Description */}
      <div className="col-span-4">
        <input
          type="text"
          value={item.description}
          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Item description"
        />
      </div>
      
      {/* Quantity */}
      <div className="col-span-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
        />
      </div>
      
      {/* Rate */}
      <div className="col-span-2">
        <input
          type="number"
          value={item.rate}
          onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
        />
      </div>
      
      {/* Amount */}
      <div className="col-span-2">
        <input
          type="number"
          value={item.amount}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
        />
      </div>
      
      {/* Actions */}
      <div className="col-span-1 flex" style={{ paddingTop: '12px' }}>
        <div className="flex items-center">
          {isLast && (
            <button
              type="button"
              onClick={addLineItem}
              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 flex items-center justify-center h-8 w-8 mr-1"
              title="Add new item"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z" />
              </svg>
            </button>
          )}
          {!isLast && lineItemsLength > 1 && (
            <div className="w-8 mr-1"></div>
          )}
          {lineItemsLength > 1 && (
            <button
              type="button"
              onClick={() => removeLineItem(item.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 flex items-center justify-center h-8 w-8"
              title="Remove item"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 4a1 1 0 011-1h6a1 1 0 011 1v1H4V4zM3 6h10v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.description === nextProps.item.description &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.rate === nextProps.item.rate &&
    prevProps.item.amount === nextProps.item.amount &&
    prevProps.index === nextProps.index &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.lineItemsLength === nextProps.lineItemsLength
  );
});

// Add display name for better debugging
SortableLineItem.displayName = 'SortableLineItem';

// Constants for dropdowns
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe'
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  // US Territories
  'Puerto Rico', 'U.S. Virgin Islands', 'American Samoa', 'Guam', 'Northern Mariana Islands'
];

export default function InvoiceForm({ invoice, isEditing = false }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || '');
  const [status, setStatus] = useState(invoice?.status || 'draft');
  const [issueDate, setIssueDate] = useState(invoice?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
  const [currency, setCurrency] = useState(invoice?.currency || 'USD');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [invoiceTitle, setInvoiceTitle] = useState(invoice?.invoiceTitle || 'Invoice');
  const [footerMessage, setFooterMessage] = useState(invoice?.footerMessage || '');
  const [taxRate, setTaxRate] = useState(() => {
    if (invoice?.tax && invoice?.subtotal) {
      return (invoice.tax / invoice.subtotal) * 100;
    }
    return 0;
  });
  
  // Settings and additional fees
  const [useCustomInvoiceNumber, setUseCustomInvoiceNumber] = useState(false);
  
  // Auto-generate invoice number if not editing and not custom
  useEffect(() => {
    if (!isEditing && !useCustomInvoiceNumber && !invoiceNumber) {
      generateInvoiceNumber();
    }
  }, [isEditing, useCustomInvoiceNumber]);
  
  // Function to generate the next invoice number
  const generateInvoiceNumber = async () => {
    try {
      const response = await fetch('/api/invoices');
      const existingInvoices = await response.json();
      
      // Get all existing invoice numbers
      const existingNumbers = existingInvoices.map((inv: any) => inv.invoiceNumber)
        .filter((num: string) => num && num.match(/^INV-[0-9A-Z]{4}$/));
      
      let nextNumber = generateNextInvoiceNumber(existingNumbers);
      setInvoiceNumber(nextNumber);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to INV-0001 if there's an error
      setInvoiceNumber('INV-0001');
    }
  };
  
  // Helper function to generate the next invoice number
  const generateNextInvoiceNumber = (existingNumbers: string[]) => {
    // Extract the suffix from existing numbers
    const suffixes = existingNumbers.map(num => num.split('-')[1]);
    
    // Find the highest number
    let highestSuffix = '0000';
    for (const suffix of suffixes) {
      if (suffix > highestSuffix) {
        highestSuffix = suffix;
      }
    }
    
    // Generate next number
    const nextSuffix = incrementInvoiceNumber(highestSuffix);
    return `INV-${nextSuffix}`;
  };
  
  // Helper function to increment invoice number following the pattern
  const incrementInvoiceNumber = (current: string) => {
    // If it's all numbers, increment the number
    if (/^[0-9]{4}$/.test(current)) {
      const num = parseInt(current);
      if (num < 9999) {
        return (num + 1).toString().padStart(4, '0');
      } else {
        return 'A001';
      }
    }
    
    // If it starts with a letter, handle letter + number increment
    const match = current.match(/^([A-Z])([0-9]{3})$/);
    if (match) {
      const letter = match[1];
      const number = parseInt(match[2]);
      
      if (number < 999) {
        return `${letter}${(number + 1).toString().padStart(3, '0')}`;
      } else {
        // Move to next letter
        const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
        if (nextLetter <= 'Z') {
          return `${nextLetter}001`;
        } else {
          // If we've exhausted single letters, go to double letters
          return 'AA01';
        }
      }
    }
    
    // Handle double letters (AA01, AB01, etc.)
    const doubleMatch = current.match(/^([A-Z]{2})([0-9]{2})$/);
    if (doubleMatch) {
      const letters = doubleMatch[1];
      const number = parseInt(doubleMatch[2]);
      
      if (number < 99) {
        return `${letters}${(number + 1).toString().padStart(2, '0')}`;
      } else {
        // Increment letters
        const firstLetter = letters[0];
        const secondLetter = letters[1];
        
        if (secondLetter < 'Z') {
          return `${firstLetter}${String.fromCharCode(secondLetter.charCodeAt(0) + 1)}01`;
        } else if (firstLetter < 'Z') {
          return `${String.fromCharCode(firstLetter.charCodeAt(0) + 1)}A01`;
        } else {
          return 'AAA1';
        }
      }
    }
    
    // Fallback
    return '0001';
  };
  
  // Customer and company data
  const [customer, setCustomer] = useState<Customer>(() => {
    if (invoice?.customer) {
      return typeof invoice.customer === 'string' ? JSON.parse(invoice.customer) : invoice.customer;
    }
    return { name: '', email: '', address: '', city: '', state: '', postalCode: '', country: '' };
  });
  
  const [company, setCompany] = useState<Company>(() => {
    if (invoice?.company) {
      return typeof invoice.company === 'string' ? JSON.parse(invoice.company) : invoice.company;
    }
    return { name: '', email: '', address: '', city: '', state: '', postalCode: '', country: '' };
  });
  
  // Customer and company profile management
  const [savedCustomers, setSavedCustomers] = useState<any[]>([]);
  const [savedCompanies, setSavedCompanies] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [customerChanged, setCustomerChanged] = useState(false);
  const [companyChanged, setCompanyChanged] = useState(false);
  const [showSaveCustomer, setShowSaveCustomer] = useState(false);
  const [showSaveCompany, setShowSaveCompany] = useState(false);
  
  // Real-time saving states
  const [customerSaveStatus, setCustomerSaveStatus] = useState<{[key: string]: 'saving' | 'saved' | 'error'}>({});
  const [companySaveStatus, setCompanySaveStatus] = useState<{[key: string]: 'saving' | 'saved' | 'error'}>({});
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  
  // Settings and additional fees
  const [showSettings, setShowSettings] = useState(false);
  const [isTaxFree, setIsTaxFree] = useState(false);
  const [hasConvenienceFee, setHasConvenienceFee] = useState(false);
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [hasSurcharge, setHasSurcharge] = useState(false);
  const [surchargePercentage, setSurchargePercentage] = useState(0);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (invoice?.lineItems) {
      const items = typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems;
      return items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        description: item.description || '',
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.amount || 0,
      }));
    }
    return [{ id: 'item-1', description: '', quantity: 1, rate: 0, amount: 0 }];
  });
  
  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const surcharge = subtotal * (surchargePercentage / 100);
  const tax = isTaxFree ? 0 : (subtotal + surcharge + convenienceFee) * (taxRate / 100);
  const total = subtotal + surcharge + convenienceFee + tax;
  
  // Fetch saved customers and companies on component mount
  useEffect(() => {
    fetchSavedCustomers();
    fetchSavedCompanies();
  }, []);
  
  // Update line item amount when quantity or rate changes
  useEffect(() => {
    setLineItems(prev => prev.map(item => ({
      ...item,
      amount: item.quantity * item.rate
    })));
  }, []);
  
  // Customer search and filtering
  useEffect(() => {
    if (customer.name.length > 0) {
      const filtered = savedCustomers.filter(c => 
        c.name.toLowerCase().includes(customer.name.toLowerCase()) &&
        c.name.toLowerCase() !== customer.name.toLowerCase()
      );
      setFilteredCustomers(filtered);
      
      // Auto-show dropdown when typing and there are matches
      if (filtered.length > 0) {
        setShowCustomerDropdown(true);
      } else {
        setShowCustomerDropdown(false);
      }
      
      // Check if current customer matches any saved customer exactly
      const exactMatch = savedCustomers.find(c => 
        c.name.toLowerCase() === customer.name.toLowerCase()
      );
      
      if (!exactMatch && customer.name.length > 2) {
        setShowSaveCustomer(true);
      } else {
        setShowSaveCustomer(false);
      }
    } else {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      setShowSaveCustomer(false);
    }
  }, [customer.name, savedCustomers]);
  
  // Company search and filtering
  useEffect(() => {
    if (company.name.length > 0) {
      const filtered = savedCompanies.filter(c => 
        c.name.toLowerCase().includes(company.name.toLowerCase()) &&
        c.name.toLowerCase() !== company.name.toLowerCase()
      );
      setFilteredCompanies(filtered);
      
      // Auto-show dropdown when typing and there are matches
      if (filtered.length > 0) {
        setShowCompanyDropdown(true);
      } else {
        setShowCompanyDropdown(false);
      }
      
      // Check if current company matches any saved company exactly
      const exactMatch = savedCompanies.find(c => 
        c.name.toLowerCase() === company.name.toLowerCase()
      );
      
      if (!exactMatch && company.name.length > 2) {
        setShowSaveCompany(true);
      } else {
        setShowSaveCompany(false);
      }
    } else {
      setFilteredCompanies([]);
      setShowCompanyDropdown(false);
      setShowSaveCompany(false);
    }
  }, [company.name, savedCompanies]);
  
  const updateLineItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  }, []);
  
  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setLineItems(prev => [...prev, newItem]);
  }, []);
  
  const removeLineItem = useCallback((id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCompany(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const fetchSavedCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setSavedCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  const fetchSavedCompanies = async () => {
    try {
      const response = await fetch('/api/company-profiles');
      const data = await response.json();
      setSavedCompanies(data);
    } catch (error) {
      console.error('Error fetching company profiles:', error);
    }
  };
  
  const selectCustomer = (selectedCustomer: any) => {
    setCustomer({
      name: selectedCustomer.name,
      email: selectedCustomer.email || '',
      address: selectedCustomer.address || '',
      city: selectedCustomer.city || '',
      state: selectedCustomer.state || '',
      postalCode: selectedCustomer.postalCode || '',
      country: selectedCustomer.country || '',
    });
    setShowCustomerDropdown(false);
    setShowSaveCustomer(false);
  };
  
  const selectCompany = (selectedCompany: any) => {
    setCompany({
      name: selectedCompany.name,
      email: selectedCompany.email || '',
      address: selectedCompany.address || '',
      city: selectedCompany.city || '',
      state: selectedCompany.state || '',
      postalCode: selectedCompany.postalCode || '',
      country: selectedCompany.country || '',
      logo: selectedCompany.logo || undefined,
    });
    setShowCompanyDropdown(false);
    setShowSaveCompany(false);
  };
  
  const saveNewCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
      
      if (response.ok) {
        await fetchSavedCustomers();
        setShowSaveCustomer(false);
        alert('Customer saved successfully!');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer.');
    }
  };
  
  const saveNewCompany = async () => {
    try {
      const response = await fetch('/api/company-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company),
      });
      
      if (response.ok) {
        await fetchSavedCompanies();
        setShowSaveCompany(false);
        alert('Company profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving company profile:', error);
      alert('Error saving company profile.');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Save or update customer and company profiles
      if (customerChanged) {
        await saveOrUpdateCustomer();
      }
      if (companyChanged) {
        await saveOrUpdateCompany();
      }

      const invoiceData = {
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        currency,
        notes,
        invoiceTitle,
        footerMessage,
        customer,
        company,
        lineItems,
        subtotal,
        tax,
        total,
      };
      
      const url = isEditing ? `/api/invoices/${invoice?.id}` : '/api/invoices';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (response.ok) {
        router.push('/');
      } else {
        throw new Error('Failed to save invoice');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveOrUpdateCustomer = async () => {
    try {
      const existingCustomer = savedCustomers.find(c =>
        c.name.toLowerCase() === customer.name.toLowerCase()
      );

      const url = existingCustomer ? `/api/customers/${existingCustomer.id}` : '/api/customers';
      const method = existingCustomer ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
    } catch (error) {
      console.error('Error saving/updating customer:', error);
    }
  };

  const saveOrUpdateCompany = async () => {
    try {
      const existingCompany = savedCompanies.find(c =>
        c.name.toLowerCase() === company.name.toLowerCase()
      );

      const url = existingCompany ? `/api/company-profiles/${existingCompany.id}` : '/api/company-profiles';
      const method = existingCompany ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company),
      });
    } catch (error) {
      console.error('Error saving/updating company:', error);
    }
  };
  const handleLogoUploadWithTracking = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleLogoUpload(e);
    setCompanyChanged(true);
  };
  
  // Real-time saving functions
  const saveCustomerRealTime = async (field: string) => {
    if (!customer.name || customer.name.length < 2) return;
    
    setCustomerSaveStatus(prev => ({ ...prev, [field]: 'saving' }));
    
    try {
      const existingCustomer = savedCustomers.find(c =>
        c.name.toLowerCase() === customer.name.toLowerCase()
      );
      
      let customerId = currentCustomerId;
      
      if (!existingCustomer && !customerId) {
        // Create new customer
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        });
        
        if (response.ok) {
          const newCustomer = await response.json();
          customerId = newCustomer.id;
          setCurrentCustomerId(customerId);
          await fetchSavedCustomers();
        }
      } else if (existingCustomer || customerId) {
        // Update existing customer
        const id = customerId || existingCustomer.id;
        await fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        });
        await fetchSavedCustomers();
      }
      
      setCustomerSaveStatus(prev => ({ ...prev, [field]: 'saved' }));
      setTimeout(() => {
        setCustomerSaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[field];
          return newStatus;
        });
      }, 2000);
    } catch (error) {
      setCustomerSaveStatus(prev => ({ ...prev, [field]: 'error' }));
      setTimeout(() => {
        setCustomerSaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[field];
          return newStatus;
        });
      }, 3000);
    }
  };
  
  const saveCompanyRealTime = async (field: string) => {
    if (!company.name || company.name.length < 2) return;
    
    setCompanySaveStatus(prev => ({ ...prev, [field]: 'saving' }));
    
    try {
      const existingCompany = savedCompanies.find(c =>
        c.name.toLowerCase() === company.name.toLowerCase()
      );
      
      let companyId = currentCompanyId;
      
      if (!existingCompany && !companyId) {
        // Create new company
        const response = await fetch('/api/company-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company),
        });
        
        if (response.ok) {
          const newCompany = await response.json();
          companyId = newCompany.id;
          setCurrentCompanyId(companyId);
          await fetchSavedCompanies();
        }
      } else if (existingCompany || companyId) {
        // Update existing company
        const id = companyId || existingCompany.id;
        await fetch(`/api/company-profiles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company),
        });
        await fetchSavedCompanies();
      }
      
      setCompanySaveStatus(prev => ({ ...prev, [field]: 'saved' }));
      setTimeout(() => {
        setCompanySaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[field];
          return newStatus;
        });
      }, 2000);
    } catch (error) {
      setCompanySaveStatus(prev => ({ ...prev, [field]: 'error' }));
      setTimeout(() => {
        setCompanySaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[field];
          return newStatus;
        });
      }, 3000);
    }
  };
  
  // Debounced saving
  const debounceTimeouts = React.useRef<{[key: string]: NodeJS.Timeout}>({});
  
  const debouncedSave = (saveFunction: (field: string) => void, field: string, delay = 1000) => {
    if (debounceTimeouts.current[field]) {
      clearTimeout(debounceTimeouts.current[field]);
    }
    
    debounceTimeouts.current[field] = setTimeout(() => {
      saveFunction(field);
    }, delay);
  };
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setLineItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Status icon component
  const StatusIcon = ({ status }: { status?: 'saving' | 'saved' | 'error' }) => {
    if (!status) return null;
    
    if (status === 'saving') {
      return <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin">⟳</div>;
    }
    if (status === 'saved') {
      return <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">✓</div>;
    }
    if (status === 'error') {
      return <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">✗</div>;
    }
    return null;
  };
  
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to invoices"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Invoice Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Invoice Details</h2>
              <button
                type="button"
                onClick={() => setShowSettings(prev => !prev)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
            
            {/* Invoice Title - Full Width Row */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Title
              </label>
              <input
                type="text"
                value={invoiceTitle}
                onChange={(e) => setInvoiceTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice"
              />
            </div>
            
            {/* Other Details - Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!useCustomInvoiceNumber ? 'bg-gray-50' : ''}`}
                  disabled={!useCustomInvoiceNumber}
                  placeholder={!useCustomInvoiceNumber ? 'Auto-generated' : 'Enter invoice number'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'open' | 'paid' | 'overdue' | 'canceled')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Settings</h3>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useCustomInvoiceNumber}
                      onChange={() => {
                        setUseCustomInvoiceNumber(prev => {
                          const newValue = !prev;
                          if (!newValue && !isEditing) {
                            // If switching back to auto-generation, generate a new number
                            generateInvoiceNumber();
                          }
                          return newValue;
                        });
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-600">Custom Invoice Number</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isTaxFree}
                      onChange={() => setIsTaxFree(prev => !prev)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-600">Tax Free</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasConvenienceFee}
                      onChange={() => setHasConvenienceFee(prev => !prev)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-600">Convenience Fee</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasSurcharge}
                      onChange={() => setHasSurcharge(prev => !prev)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-600">Surcharge</label>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  >
                    Apply Settings
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Company Information */}
          	<div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">From</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => {
                      setCompany(prev => ({ ...prev, name: e.target.value }));
                      setCompanyChanged(true);
                      debouncedSave(saveCompanyRealTime, 'name');
                    }}
                    className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
onFocus={() => {
  if (filteredCompanies.length > 0) {
    setShowCompanyDropdown(true);
  }
}}
onBlur={() => {
  setTimeout(() => setShowCompanyDropdown(false), 150);
}}
                  />
                  {/* Magnifying glass icon */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                  </div>
                  <StatusIcon status={companySaveStatus.name} />
                </div>
                
                {/* Company dropdown */}
                {showCompanyDropdown && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {filteredCompanies.map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => selectCompany(comp)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{comp.name}</div>
                        <div className="text-sm text-gray-500">{comp.email || 'No email'}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Save company option */}
                {showSaveCompany && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={saveNewCompany}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      🏢 Save "{company.name}" as new company profile
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => {
                      setCompany(prev => ({ ...prev, email: e.target.value }));
                      setCompanyChanged(true);
                      debouncedSave(saveCompanyRealTime, 'email');
                    }}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <StatusIcon status={companySaveStatus.email} />
                </div>
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => {
                    setCompany(prev => ({ ...prev, address: e.target.value }));
                    setCompanyChanged(true);
                    debouncedSave(saveCompanyRealTime, 'address');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <StatusIcon status={companySaveStatus.address} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => {
                    setCompany(prev => ({ ...prev, city: e.target.value }));
                    setCompanyChanged(true);
                    debouncedSave(saveCompanyRealTime, 'city');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <StatusIcon status={companySaveStatus.city} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={company.country}
                  onChange={(e) => {
                    setCompany(prev => ({ ...prev, country: e.target.value }));
                    setCompanyChanged(true);
                    debouncedSave(saveCompanyRealTime, 'country');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <StatusIcon status={companySaveStatus.country} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={company.state}
                  onChange={(e) => {
                    setCompany(prev => ({ ...prev, state: e.target.value }));
                    setCompanyChanged(true);
                    debouncedSave(saveCompanyRealTime, 'state');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={company.country !== 'United States of America'}
                >
                  <option value="">Select a state</option>
                  {company.country === 'United States of America' && US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <StatusIcon status={companySaveStatus.state} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={company.postalCode}
                  onChange={(e) => {
                    setCompany(prev => ({ ...prev, postalCode: e.target.value }));
                    setCompanyChanged(true);
                    debouncedSave(saveCompanyRealTime, 'postalCode');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <StatusIcon status={companySaveStatus.postalCode} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUploadWithTracking}
                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {company.logo && (
                    <div className="flex items-center space-x-2">
                      <img
                        src={company.logo}
                        alt="Company logo"
                        className="h-12 w-12 object-contain border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCompany(prev => ({ ...prev, logo: undefined }));
                          setCompanyChanged(true);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer Information */}
          	<div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bill To</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer(prev => ({ ...prev, name: e.target.value }));
                      setCustomerChanged(true);
                      debouncedSave(saveCustomerRealTime, 'name');
                    }}
                    className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
onFocus={() => {
  if (filteredCustomers.length > 0) {
    setShowCustomerDropdown(true);
  }
}}
onBlur={() => {
  setTimeout(() => setShowCustomerDropdown(false), 150);
}}
                  />
                  {/* Magnifying glass icon */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                  </div>
                  <StatusIcon status={customerSaveStatus.name} />
                </div>
                
                {/* Customer dropdown */}
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {filteredCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => selectCustomer(cust)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{cust.name}</div>
                        <div className="text-sm text-gray-500">{cust.email || 'No email'}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Save customer option */}
                {showSaveCustomer && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={saveNewCustomer}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      💾 Save "{customer.name}" as new customer
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => {
                      setCustomer(prev => ({ ...prev, email: e.target.value }));
                      setCustomerChanged(true);
                      debouncedSave(saveCustomerRealTime, 'email');
                    }}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <StatusIcon status={customerSaveStatus.email} />
                </div>
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={customer.address}
                  onChange={(e) => {
                    setCustomer(prev => ({ ...prev, address: e.target.value }));
                    setCustomerChanged(true);
                    debouncedSave(saveCustomerRealTime, 'address');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <StatusIcon status={customerSaveStatus.address} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={customer.city}
                  onChange={(e) => {
                    setCustomer(prev => ({ ...prev, city: e.target.value }));
                    setCustomerChanged(true);
                    debouncedSave(saveCustomerRealTime, 'city');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <StatusIcon status={customerSaveStatus.city} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={customer.country}
                  onChange={(e) => {
                    setCustomer(prev => ({ ...prev, country: e.target.value }));
                    setCustomerChanged(true);
                    debouncedSave(saveCustomerRealTime, 'country');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <StatusIcon status={customerSaveStatus.country} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={customer.state}
                  onChange={(e) => {
                    setCustomer(prev => ({ ...prev, state: e.target.value }));
                    setCustomerChanged(true);
                    debouncedSave(saveCustomerRealTime, 'state');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={customer.country !== 'United States of America'}
                >
                  <option value="">Select a state</option>
                  {customer.country === 'United States of America' && US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <StatusIcon status={customerSaveStatus.state} />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={customer.postalCode}
                  onChange={(e) => {
                    setCustomer(prev => ({ ...prev, postalCode: e.target.value }));
                    setCustomerChanged(true);
                    debouncedSave(saveCustomerRealTime, 'postalCode');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <StatusIcon status={customerSaveStatus.postalCode} />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white shadow rounded-lg p-6">
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-gray-200">
              <div className="col-span-1"></div> {/* Space for drag handle */}
              <div className="col-span-4">
                <span className="text-sm font-medium text-gray-700">Description</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-700">Rate</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-700">Amount</span>
              </div>
              <div className="col-span-1"></div> {/* Space for actions */}
            </div>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={lineItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <SortableLineItem
                      key={item.id}
                      item={item}
                      index={index}
                      isLast={index === lineItems.length - 1}
                      updateLineItem={updateLineItem}
                      addLineItem={addLineItem}
                      removeLineItem={removeLineItem}
                      lineItemsLength={lineItems.length}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {/* Totals */}
            <div className="border-t pt-4 mt-6">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {hasConvenienceFee && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Convenience Fee:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          value={convenienceFee}
                          onChange={(e) => setConvenienceFee(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  )}
                  
                  {hasSurcharge && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">Surcharge:</span>
                        <button
                          type="button"
                          onClick={() => alert('State laws may apply to assessing a surcharge')}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          title="Information"
                        >
                          ℹ️
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={surchargePercentage}
                          onChange={(e) => setSurchargePercentage(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                          step="0.1"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  )}
                  
                  {!isTaxFree && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tax Rate:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="1"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium">
                      {isTaxFree ? 'Free' : `$${tax.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-base font-medium">Total:</span>
                    <span className="text-base font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Additional notes or terms..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Message
                </label>
                <textarea
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Thank you for your business!"
                />
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-4">
            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Invoice Preview</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <InvoicePreview
                    invoiceNumber={invoiceNumber}
                    status={status}
                    issueDate={issueDate}
                    dueDate={dueDate}
                    currency={currency}
                    notes={notes}
                    footerMessage={footerMessage}
                    customer={customer}
                    company={company}
                    lineItems={lineItems}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    taxRate={taxRate}
                    isTaxFree={isTaxFree}
                    hasConvenienceFee={hasConvenienceFee}
                    convenienceFee={convenienceFee}
                    hasSurcharge={hasSurcharge}
                    surchargePercentage={surchargePercentage}
                  />
                </div>
              </DialogContent>
            </Dialog>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
