"use client";

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

interface NDPSPaymentProps {
  orderId: number;
  amount: number;
  customerEmail: string;
  customerMobile: string;
  onSuccess: (paymentId: number) => void;
  onError: (error: string) => void;
}

// Extend Window interface for AtomPaynetz
declare global {
  interface Window {
    AtomPaynetz: any;
  }
}

export default function NDPSPayment({ 
  orderId, 
  amount, 
  customerEmail, 
  customerMobile, 
  onSuccess, 
  onError 
}: NDPSPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load AtomPaynetz script dynamically (like working implementation)
  useEffect(() => {
    const loadAtomScript = () => {
      // Remove existing script if any
      const existingScript = document.querySelector('script[src*="atomcheckout.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script with timestamp to prevent caching
      const script = document.createElement('script');
      script.src = `https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js?v=${Date.now()}`;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ AtomPaynetz script loaded successfully');
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load AtomPaynetz script');
        onError('Failed to load payment system');
      };

      document.head.appendChild(script);
    };

    loadAtomScript();

    return () => {
      // Cleanup
      const script = document.querySelector('script[src*="atomcheckout.js"]');
      if (script) {
        script.remove();
      }
    };
  }, [onError]);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      onError('Payment system is still loading. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      // Get token from backend using the corrected AES-256-CBC method
      console.log('Initiating NDPS payment...');
      console.log('Order ID:', orderId);
      console.log('Amount:', amount);
      console.log('Customer:', customerEmail, customerMobile);

      const response = await apiRequest<{
        success: boolean;
        paymentId: number;
        atomTokenId: number;
        merchId: string;
        merchTxnId: string;
        customerEmail: string;
        customerMobile: string;
        returnUrl: string;
        env: 'uat' | 'prod';
      }>('/api/ndps/initiate', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          amount,
          customerEmail,
          customerMobile
        })
      });

      console.log('=== Backend Response ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Token type:', typeof response.atomTokenId);
      console.log('Token value:', response.atomTokenId);

      // Validate response
      if (!response.atomTokenId || !response.paymentId) {
        throw new Error('Invalid response from payment gateway. Please try again or use Cash on Delivery.');
      }

      // Store payment info for later
      localStorage.setItem('ndps_payment_id', response.paymentId.toString());
      localStorage.setItem('ndps_merch_txn_id', response.merchTxnId);

      // Open AtomPaynetz popup (exact format from working implementation)
      if (!window.AtomPaynetz) {
        throw new Error('AtomPaynetz library not loaded');
      }

      // Configuration object (EXACT format from working implementation)
      const atomConfig = {
        atomTokenId: response.atomTokenId.toString(), // Convert number to string
        merchId: response.merchId.toString(),
        custEmail: response.customerEmail,
        custMobile: response.customerMobile,
        returnUrl: response.returnUrl
      };

      console.log('=== Opening AtomPaynetz Popup ===');
      console.log('Config:', JSON.stringify(atomConfig, null, 2));
      console.log('Environment:', response.env);
      console.log('AtomPaynetz available:', typeof window.AtomPaynetz);

      // Create AtomPaynetz instance (as per working implementation)
      const atom = new window.AtomPaynetz(atomConfig, response.env);
      
      console.log('✅ AtomPaynetz instance created');
      console.log('Popup should open automatically...');
      // The popup will open automatically
      // After payment, user will be redirected to returnUrl
      
    } catch (error: any) {
      console.error('❌ Payment initiation failed:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific errors with user-friendly messages
      let errorMessage = 'Failed to initiate payment';
      
      if (error.message?.includes('empty') || error.message?.includes('content-length')) {
        errorMessage = 'Payment gateway is temporarily unavailable. Please try Cash on Delivery or contact support.';
      } else if (error.message?.includes('Invalid response')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>Secure Payment via NTT DATA</h3>
      <p>Amount: <strong>₹{amount.toFixed(2)}</strong></p>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        A secure payment popup will open to complete your transaction.
      </p>
      
      <button
        onClick={handlePayment}
        disabled={loading || !scriptLoaded}
        className="vs-btn"
        style={{ minWidth: '200px' }}
      >
        {!scriptLoaded ? (
          <>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
            Loading...
          </>
        ) : loading ? (
          <>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
            Opening Payment...
          </>
        ) : (
          <>
            <i className="fas fa-credit-card" style={{ marginRight: '8px' }}></i>
            Pay Now
          </>
        )}
      </button>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        <p>🔒 Your payment is secured by NTT DATA Payment Services</p>
        <p>Supported: Credit Card, Debit Card, Net Banking, UPI, Wallets</p>
      </div>
    </div>
  );
}