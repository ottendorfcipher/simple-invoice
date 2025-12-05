# Footer Message Feature

## Overview
The footer message on invoice PDFs is now configurable instead of being hardcoded to "Thank you for your business!".

## Changes Made

### 1. Database Schema (`src/db/schema.ts`)
- Added `invoiceTitle` field with default value "Invoice"
- Added `footerMessage` field with default value "Thank you for your business!"

### 2. Invoice Form (`src/components/InvoiceForm.tsx`)
- Added form state for `footerMessage` that initializes from existing invoice data
- Added `footerMessage` to the invoice data payload when creating/updating invoices
- Added textarea input in the "Additional Info" section for users to customize the footer message
- Passed `footerMessage` prop to the InvoicePreview component

### 3. Invoice Preview Component (`src/components/InvoicePreview.tsx`)
- Added `footerMessage` as an optional prop
- Updated footer section to use the `footerMessage` prop instead of hardcoded text
- Falls back to "Thank you for your business!" if not provided

### 4. PDF Generation Routes
- **`src/app/api/invoices/[id]/pdf/route.ts`**: Updated to use `invoice.footerMessage` from database
- **`src/app/api/invoices/[id]/pdf/preview/route.ts`**: Updated to use `invoice.footerMessage` from database

### 5. API Routes
- **POST `/api/invoices/route.ts`**: Already supports saving `footerMessage` 
- **PUT `/api/invoices/[id]/route.ts`**: Already supports updating `footerMessage`

### 6. Database Adapter (`src/db/json-adapter.ts`)
- Already includes support for `invoiceTitle` and `footerMessage` in insert and update operations

### 7. Migration Script (`migrate-add-fields.js`)
- Created migration script to add default values to existing invoices
- Run with: `node migrate-add-fields.js`

## Usage

### Creating a New Invoice
1. Navigate to the invoice creation form
2. Scroll to the "Additional Info" section
3. Edit the "Footer Message" field to customize the message that appears at the bottom of the PDF
4. The default value is "Thank you for your business!"

### Editing an Existing Invoice
1. Open an existing invoice for editing
2. The current footer message will be loaded from the database
3. Modify the "Footer Message" field as needed
4. Save the invoice to update the footer message

### Preview
- Click the "Preview" button to see how your invoice will look with the custom footer message
- The preview shows the exact formatting that will appear in the PDF

## Migration
If you have existing invoices, run the migration script to add default values:

```bash
node migrate-add-fields.js
```

This will add:
- `invoiceTitle: "Invoice"` to all existing invoices
- `footerMessage: "Thank you for your business!"` to all existing invoices

## Technical Notes
- The footer message is stored in the database as a text field
- Empty footer messages will fall back to the default "Thank you for your business!"
- The field accepts multi-line text (textarea input)
- Changes are reflected in both the preview and the generated PDF
