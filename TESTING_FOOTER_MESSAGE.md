# Testing the Footer Message Feature

## Prerequisites
1. Install dependencies: `npm install`
2. Run the migration script if you have existing invoices: `node migrate-add-fields.js`
3. Start the development server: `npm run dev`

## Test Cases

### Test 1: Create a New Invoice with Custom Footer
1. Navigate to the invoice creation page
2. Fill in the required fields (company info, customer info, line items)
3. Scroll to the "Additional Info" section
4. Locate the "Footer Message" textarea (should have placeholder "Thank you for your business!")
5. Change the footer message to something custom like: "We appreciate your partnership!"
6. Click "Preview" to see the invoice preview
7. Verify the custom footer message appears at the bottom of the preview
8. Save the invoice
9. Open the invoice and click "Print" or download the PDF
10. Verify the custom footer message appears in the generated PDF

**Expected Result**: Custom footer message appears in both preview and PDF

### Test 2: Edit Existing Invoice Footer
1. Open an existing invoice for editing
2. Verify the current footer message is displayed in the "Footer Message" field
3. Update the footer message to a new value
4. Preview the invoice
5. Verify the updated footer message appears in the preview
6. Save the invoice
7. Generate the PDF
8. Verify the updated footer message appears in the PDF

**Expected Result**: Footer message updates successfully

### Test 3: Empty Footer Message
1. Create or edit an invoice
2. Clear the "Footer Message" field completely
3. Preview the invoice
4. Verify it falls back to "Thank you for your business!"
5. Save and generate PDF
6. Verify the default message appears in the PDF

**Expected Result**: Default message is used when field is empty

### Test 4: Multi-line Footer Message
1. Create or edit an invoice
2. Enter a multi-line footer message:
   ```
   Thank you for your business!
   Please remit payment within 30 days.
   Questions? Contact us at billing@example.com
   ```
3. Preview the invoice
4. Verify all lines appear in the preview
5. Generate the PDF
6. Verify all lines appear in the PDF

**Expected Result**: Multi-line messages are preserved

### Test 5: Existing Invoice Compatibility
1. If you had invoices before the feature was added, run: `node migrate-add-fields.js`
2. Open an existing invoice
3. Verify the default footer message "Thank you for your business!" is present
4. Verify the invoice can be edited and saved without issues
5. Generate the PDF
6. Verify the footer appears correctly

**Expected Result**: Existing invoices work seamlessly with default values

## Verification Checklist
- [ ] Form displays "Footer Message" field in Additional Info section
- [ ] Field accepts text input (including multi-line)
- [ ] Default placeholder is "Thank you for your business!"
- [ ] Custom messages appear in preview
- [ ] Custom messages appear in generated PDFs
- [ ] Empty field falls back to default message
- [ ] Existing invoices show correct footer when edited
- [ ] Footer messages persist when invoice is saved and reopened

## Troubleshooting

### Footer not appearing in PDF
- Check that the invoice was saved after editing
- Verify the database has the `footerMessage` field
- Run the migration script: `node migrate-add-fields.js`

### Getting a database error
- Check that the database schema includes `invoiceTitle` and `footerMessage`
- Verify the API routes are handling these fields correctly
- Check browser console and server logs for specific errors

### Preview shows old message
- Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Clear browser cache
- Check that you saved the invoice after changing the footer

## Success Criteria
✅ Footer message is configurable via the form
✅ Custom messages appear in preview and PDF
✅ Default value works for new invoices
✅ Existing invoices migrate successfully
✅ Empty field gracefully falls back to default
