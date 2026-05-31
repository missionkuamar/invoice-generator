import InvoiceList from '../components/Invoice/InvoiceList';
import { FiShuffle } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { getRandomInvoice } from '../services/invoiceService';  // ← Changed: import from service, not slice
import { setCurrentInvoice } from '../store/slices/invoiceSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Invoices() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleRandomInvoice = async () => {
    try {
      const invoice = await getRandomInvoice();
      dispatch(setCurrentInvoice(invoice));
      navigate(`/invoices/edit/${invoice._id}`);
      toast.success('Random invoice loaded');
    } catch (error) {
      toast.error(error.message || 'No invoices found');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage all your invoices</p>
        </div>
        <button
          onClick={handleRandomInvoice}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <FiShuffle className="mr-2" />
          Random Invoice
        </button>
      </div>
      <InvoiceList />
    </div>
  );
}