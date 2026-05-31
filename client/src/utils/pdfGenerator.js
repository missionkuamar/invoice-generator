import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generatePDF = async (invoiceElement, shopProfile, invoice) => {
  const canvas = await html2canvas(invoiceElement, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`invoice_${invoice.invoiceNumber}.pdf`);
};

export const generateInvoiceHTML = (shop, invoice) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          ${shop.shopLogo ? `<img src="${shop.shopLogo}" style="max-width: 150px;" />` : ''}
          <h2>${shop.shopName}</h2>
          <p>${shop.address?.street || ''}<br/>${shop.address?.city || ''} ${shop.address?.pincode || ''}</p>
          <p>GST: ${shop.gstNumber || 'Not Registered'}</p>
        </div>
        <div>
          <h1>INVOICE</h1>
          <p>Number: ${invoice.invoiceNumber}</p>
          <p>Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          ${invoice.dueDate ? `<p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3>Bill To:</h3>
        <p>${invoice.customer.name}<br/>${invoice.customer.address || ''}<br/>${invoice.customer.phone || ''}<br/>GST: ${invoice.customer.gstNumber || 'N/A'}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr><th style="border: 1px solid #ddd; padding: 8px;">Item</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
            <th style="border: 1px solid #ddd; padding: 8px;">GST%</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">₹${item.unitPrice}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.gstRate}%</td>
              <td style="border: 1px solid #ddd; padding: 8px;">₹${item.amount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="text-align: right;">
        <p>Subtotal: ₹${invoice.subtotal}</p>
        <p>Total GST: ₹${invoice.totalGst}</p>
        <h3>Grand Total: ₹${invoice.grandTotal}</h3>
      </div>
      
      ${invoice.notes ? `<div style="margin-top: 30px;"><p><strong>Notes:</strong> ${invoice.notes}</p></div>` : ''}
      ${shop.footerNote ? `<div style="margin-top: 20px; text-align: center;"><p>${shop.footerNote}</p></div>` : ''}
    </div>
  `;
};