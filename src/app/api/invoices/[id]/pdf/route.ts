import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 40,
    paddingHorizontal: 60,
    lineHeight: 1.3,
    flexDirection: 'column',
    color: '#1d1d1f',
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
    color: '#1d1d1f',
    fontWeight: 'thin',
    letterSpacing: 1.5,
  },
  companyInfo: {
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '1px solid #e5e5e7',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#86868b',
    marginBottom: 2,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: '1px solid #e5e5e7',
  },
  detailsLeft: {
    flexDirection: 'column',
    width: '48%',
  },
  detailsRight: {
    flexDirection: 'column',
    width: '48%',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 9,
    color: '#86868b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 11,
    color: '#1d1d1f',
    marginBottom: 8,
  },
  customerInfo: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: '1px solid #e5e5e7',
  },
  customerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 5,
  },
  customerDetails: {
    fontSize: 10,
    color: '#86868b',
    marginBottom: 2,
  },
  itemsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottom: '1px solid #f5f5f7',
  },
  itemDesc: {
    width: '50%',
    fontSize: 11,
    color: '#1d1d1f',
  },
  itemQty: {
    width: '15%',
    fontSize: 11,
    color: '#86868b',
    textAlign: 'center',
  },
  itemRate: {
    width: '17.5%',
    fontSize: 11,
    color: '#86868b',
    textAlign: 'right',
  },
  itemAmount: {
    width: '17.5%',
    fontSize: 11,
    color: '#1d1d1f',
    textAlign: 'right',
    fontWeight: 'medium',
  },
  totalsSection: {
    marginTop: 25,
    paddingTop: 15,
    borderTop: '1px solid #e5e5e7',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 11,
    color: '#86868b',
  },
  totalAmount: {
    fontSize: 11,
    color: '#1d1d1f',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 10,
    borderTop: '1px solid #e5e5e7',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  notesSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #e5e5e7',
  },
  notesLabel: {
    fontSize: 9,
    color: '#86868b',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 10,
    color: '#1d1d1f',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#86868b',
  },
});

// Helper function to format date as MM-DD-YYYY
function formatDate(dateString: string): string {
  if (!dateString) return '';
  // Parse date string directly to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${month}-${day}-${year}`;
}

function InvoicePDF({ invoice }: { invoice: any }) {
  const customer = typeof invoice.customer === 'string' ? JSON.parse(invoice.customer) : invoice.customer;
  const company = typeof invoice.company === 'string' ? JSON.parse(invoice.company) : invoice.company;
  const lineItems = typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems;

  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page },
      // Logo (if available)
      company.logo && React.createElement(View, { style: { position: 'absolute', top: 20, left: 60 } },
        React.createElement(Image, { 
          src: company.logo, 
          style: { width: 60, height: 60, objectFit: 'contain' } 
        })
      ),
      
      // Header
      React.createElement(Text, { style: styles.header }, "Invoice"),
      
      // Company Info
      React.createElement(View, { style: styles.companyInfo },
        React.createElement(Text, { style: styles.companyName }, company.name || 'Your Company'),
        company.address && React.createElement(Text, { style: styles.companyDetails }, company.address),
        (company.city || company.state || company.postalCode) && React.createElement(Text, { style: styles.companyDetails }, 
          [company.city, company.state, company.postalCode].filter(Boolean).join(', ')
        ),
        company.email && React.createElement(Text, { style: styles.companyDetails }, company.email)
      ),
      
      // Invoice Details
      React.createElement(View, { style: styles.invoiceDetails },
        React.createElement(View, { style: styles.detailsLeft },
          React.createElement(Text, { style: styles.label }, "Bill To"),
          React.createElement(Text, { style: styles.customerName }, customer.name || 'Customer Name'),
          customer.address && React.createElement(Text, { style: styles.customerDetails }, customer.address),
          customer.email && React.createElement(Text, { style: styles.customerDetails }, customer.email)
        ),
        React.createElement(View, { style: styles.detailsRight },
          React.createElement(Text, { style: styles.text }, invoice.invoiceNumber),
          React.createElement(Text, { style: styles.label }, "Invoice Date"),
          React.createElement(Text, { style: styles.text }, formatDate(invoice.issueDate)),
          invoice.dueDate && React.createElement(Text, { style: styles.label }, "Due Date"),
          invoice.dueDate && React.createElement(Text, { style: styles.text }, formatDate(invoice.dueDate))
        )
      ),
      
      // Items Section
      React.createElement(Text, { style: styles.itemsHeader }, "Items"),
      
      // Line Items
      ...lineItems.map((item: any, index: number) =>
        React.createElement(View, { key: index, style: styles.itemRow },
          React.createElement(Text, { style: styles.itemDesc }, item.description || ''),
          React.createElement(Text, { style: styles.itemQty }, item.quantity || 0),
          React.createElement(Text, { style: styles.itemRate }, `$${(item.rate || 0).toFixed(2)}`),
          React.createElement(Text, { style: styles.itemAmount }, `$${(item.amount || 0).toFixed(2)}`)
        )
      ),
      
      // Totals Section
      React.createElement(View, { style: styles.totalsSection },
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Subtotal"),
          React.createElement(Text, { style: styles.totalAmount }, `$${(invoice.subtotal || 0).toFixed(2)}`)
        ),
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Tax"),
          React.createElement(Text, { style: styles.totalAmount }, `$${(invoice.tax || 0).toFixed(2)}`)
        ),
        React.createElement(View, { style: styles.grandTotal },
          React.createElement(Text, { style: styles.grandTotalLabel }, "Total"),
          React.createElement(Text, { style: styles.grandTotalAmount }, `$${(invoice.total || 0).toFixed(2)}`)
        )
      ),
      
      // Notes Section
      invoice.notes && React.createElement(View, { style: styles.notesSection },
        React.createElement(Text, { style: styles.notesLabel }, "Notes"),
        React.createElement(Text, { style: styles.notesText }, invoice.notes)
      ),
      
      // Footer
      invoice.footerMessage && React.createElement(Text, { style: styles.footer }, invoice.footerMessage)
    )
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const instance = await db.getInstance();
    const result = await instance.select().from(invoices).where(eq(invoices.id, id));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    const invoice = result[0];
    const pdfDoc = pdf(InvoicePDF({ invoice }));
    const pdfBlob = await pdfDoc.toBlob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
