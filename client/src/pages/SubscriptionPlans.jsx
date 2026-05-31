import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiShield, FiZap, FiStar, } from 'react-icons/fi';
import { IoDiamondOutline } from "react-icons/io5";
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SubscriptionPlans() {
  const { userInfo } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState({});
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchCurrentPlan();
  }, []);

  const fetchPlans = async () => {
    const { data } = await api.get('/subscription/plans');
    setPlans(data);
  };

  const fetchCurrentPlan = async () => {
    const { data } = await api.get('/subscription/current');
    setCurrentPlan(data);
  };

  const handleSubscribe = async (planKey, plan) => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      const { data: order } = await api.post('/subscription/create-order', { plan: planKey });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'InvoiceGen SaaS',
        description: `${plan.name} Plan Subscription`,
        order_id: order.id,
        handler: async (response) => {
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: planKey,
          };
          
          const { data: verifyResult } = await api.post('/subscription/verify', verifyData);
          if (verifyResult.success) {
            toast.success('Subscription activated successfully!');
            fetchCurrentPlan();
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: userInfo?.name,
          email: userInfo?.email,
        },
        theme: {
          color: '#2563eb',
        },
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const planIcons = {
    free: FiShield,
    basic: FiZap,
    premium: FiStar,
    business: IoDiamondOutline,
    enterprise: IoDiamondOutline,
    pro_max: IoDiamondOutline,
    ultimate: FiStar,
    platinum: IoDiamondOutline,
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Choose Your Plan</h1>
        <p className="text-gray-500 mt-2">Scale your business with the perfect plan</p>
      </div>

      {/* Current Plan Status */}
      {currentPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Current Subscription</h3>
              <p className="text-2xl font-bold text-blue-700">{currentPlan.planDetails?.name} Plan</p>
              <p className="text-sm text-blue-600 mt-1">
                {currentPlan.invoicesUsed} / {currentPlan.planDetails?.invoiceLimit} invoices used this month
              </p>
              <p className="text-sm text-blue-600">
                Remaining: {currentPlan.remainingInvoices} invoices
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Valid until</p>
              <p className="font-semibold">
                {currentPlan.expiryDate ? new Date(currentPlan.expiryDate).toLocaleDateString() : 'Never expires'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(plans).map(([key, plan]) => {
          const Icon = planIcons[key] || FiCheck;
          const isCurrentPlan = currentPlan?.plan === key;
          
          return (
            <div key={key} className={`card relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm">
                  Current
                </div>
              )}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Up to {plan.invoiceLimit} invoices/month
                </p>
              </div>
              
              <div className="border-t mt-6 pt-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <FiCheck className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => handleSubscribe(key, plan)}
                disabled={loading || isCurrentPlan}
                className={`w-full mt-6 py-2 rounded-lg transition-colors ${
                  isCurrentPlan
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}