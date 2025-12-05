/**
 * Migration script to add footerMessage and invoiceTitle fields to existing invoices
 * Run this with: node migrate-add-fields.js
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'invoice-data.json');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('No database file found. Migration not needed.');
  process.exit(0);
}

// Load the database
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Track if any changes were made
let changesMade = false;

// Add missing fields to existing invoices
if (data.invoices && Array.isArray(data.invoices)) {
  data.invoices = data.invoices.map(invoice => {
    const updated = { ...invoice };
    
    // Add invoiceTitle if missing
    if (!updated.hasOwnProperty('invoiceTitle')) {
      updated.invoiceTitle = 'Invoice';
      changesMade = true;
      console.log(`Added invoiceTitle to invoice ${invoice.invoiceNumber || invoice.id}`);
    }
    
    // Add footerMessage if missing
    if (!updated.hasOwnProperty('footerMessage')) {
      updated.footerMessage = 'Thank you for your business!';
      changesMade = true;
      console.log(`Added footerMessage to invoice ${invoice.invoiceNumber || invoice.id}`);
    }
    
    return updated;
  });
}

// Save the updated database if changes were made
if (changesMade) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('\nMigration completed successfully!');
  console.log(`Updated ${data.invoices.length} invoice(s)`);
} else {
  console.log('No changes needed. All invoices already have the required fields.');
}
