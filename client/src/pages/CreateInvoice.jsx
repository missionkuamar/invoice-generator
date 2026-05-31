import InvoiceForm from '../components/Invoice/InvoiceForm';

export default function CreateInvoice() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {window.location.pathname.includes('edit') ? 'Edit Invoice' : 'Create New Invoice'}
        </h1>
        <p className="text-gray-500 mt-1">
          {window.location.pathname.includes('edit') 
            ? 'Update invoice details' 
            : 'Fill in the details to generate a new invoice'}
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}