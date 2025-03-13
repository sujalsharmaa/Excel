import React, { useState, useEffect } from 'react';
import { CheckCircle, Shield, Box, CloudLightning } from 'lucide-react';
import { useAuthStore } from '@/Store/useStore.js';

const PaymentPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuthStore.getState();

  const plans = {
    basic: {
      name: 'Basic',
      storage: '50GB',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      buttonId: 'pl_Q5KpbAz1ebleF7', // Replace with your actual button IDs
      yearlyButtonId: 'pl_Q5KpbAz1ebleF7',
      features: [
        'Basic storage access',
        'Standard support',
        'Single user access'
      ]
    },
    pro: {
      name: 'Professional',
      storage: '100GB',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      buttonId: 'pl_Q5KpbAz1ebleF7', // Replace with your actual button IDs
      yearlyButtonId: 'pl_Q5KpbAz1ebleF7',
      features: [
        'Expanded storage capacity',
        'Priority support',
        'Up to 3 team members',
        'Advanced analytics'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      storage: '500GB',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      buttonId: 'pl_Q5KpbAz1ebleF7', // Replace with your actual button IDs
      yearlyButtonId: 'pl_Q5KpbAz1ebleF7',
      features: [
        'Maximum storage allocation',
        '24/7 dedicated support',
        'Unlimited team members',
        'Custom integrations',
        'Enhanced security features'
      ]
    }
  };

  // Function to handle successful payment
  const handleSuccess = () => {
    setIsLoading(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // Function to load the Razorpay button
  useEffect(() => {
    // Clear any existing payment buttons
    const existingForm = document.getElementById('razorpay-payment-form');
    if (existingForm) {
      while (existingForm.firstChild) {
        existingForm.removeChild(existingForm.firstChild);
      }
    }

    // Get the current plan and button ID
    const plan = plans[selectedPlan];
    const buttonId = isYearly ? plan.yearlyButtonId : plan.buttonId;

    // Create and append the script for the selected plan
    const script = document.createElement('script');
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute('data-payment_button_id', buttonId);
    script.async = true;
    
    // Append to the form
    const form = document.getElementById('razorpay-payment-form');
    if (form) {
      form.appendChild(script);
    }
  }, [selectedPlan, isYearly]);

  // Add a success callback listener
  useEffect(() => {
    const handleRazorpaySuccess = () => {
      handleSuccess();
    };

    window.addEventListener('razorpay.success', handleRazorpaySuccess);
    
    return () => {
      window.removeEventListener('razorpay.success', handleRazorpaySuccess);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upgrade Your Storage</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose the perfect plan to elevate your experience with enhanced storage capabilities.</p>
        </div>
        
        {/* Billing Toggle */}
        <div className="flex justify-center items-center mb-8">
          <span className={`mr-3 ${!isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setIsYearly(!isYearly)} 
            className="relative inline-flex h-6 w-12 items-center rounded-full bg-gray-300"
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isYearly ? 'translate-x-7' : 'translate-x-1'}`} 
            />
          </button>
          <span className={`ml-3 ${isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">Save 16%</span>
          </span>
        </div>
        
        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Object.keys(plans).map((planKey) => {
            const plan = plans[planKey];
            const isSelected = selectedPlan === planKey;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            
            return (
              <div 
                key={planKey} 
                className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${isSelected ? 'ring-2 ring-lime-500 transform scale-105' : 'hover:shadow-xl'}`}
                onClick={() => setSelectedPlan(planKey)}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 mb-4">{plan.storage} Storage</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">₹{price}</span>
                    <span className="text-gray-500">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-lime-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      isSelected
                        ? 'bg-lime-500 hover:bg-lime-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Payment Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">{plans[selectedPlan].name} Plan ({isYearly ? 'Yearly' : 'Monthly'})</span>
              <span className="font-medium">₹{isYearly ? plans[selectedPlan].yearlyPrice : plans[selectedPlan].monthlyPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Storage Allocation</span>
              <span className="font-medium">{plans[selectedPlan].storage}</span>
            </div>
            {isYearly && (
              <div className="flex justify-between text-green-600">
                <span>Yearly Discount</span>
                <span>-₹{Math.round(plans[selectedPlan].monthlyPrice * 12 * 0.16)}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{isYearly ? plans[selectedPlan].yearlyPrice : plans[selectedPlan].monthlyPrice}</span>
              </div>
            </div>
          </div>
          
          {showSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Payment successful! Your storage has been upgraded.
            </div>
          ) : (
            <div className="flex justify-center">
              <form id="razorpay-payment-form" className="w-full">
                {/* Razorpay button script will be inserted here by useEffect */}
                <script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_Q5KpbAz1ebleF7" async> </script> 
              </form>
            </div>
          )}
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 text-gray-500">
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center">
            <Box className="h-5 w-5 mr-2" />
            <span>Instant Activation</span>
          </div>
          <div className="flex items-center">
            <CloudLightning className="h-5 w-5 mr-2" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;