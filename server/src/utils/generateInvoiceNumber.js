import Invoice from '../models/Invoice.js';

export const generateInvoiceNumber = async (shopId) => {
  const lastInvoice = await Invoice.findOne({ shop: shopId })
    .sort({ createdAt: -1 })
    .limit(1);
  
  let lastNumber = 0;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/\d+$/);
    if (match) {
      lastNumber = parseInt(match[0]);
    }
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(6, '0');
  return `INV-${newNumber}`;
};