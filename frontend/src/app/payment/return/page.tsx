"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function PaymentReturnContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Extract params from URL directly
        if (typeof window === 'undefined') return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const merchTxnIdFromUrl = urlParams.get('merchTxnId');
        const paymentIdFromUrl = urlParams.get('paymentId');

        // Get from localStorage if not in URL
        let merchTxnId = localStorage.getItem('ndps_merch_txn_id') || merchTxnIdFromUrl;
        let paymentId = localStorage.getItem('ndps_payment_id') || paymentIdFromUrl;

        console.log('Payment Return Page Loaded');
        console.log('Merchant Txn ID:', merchTxnId);
        console.log('Payment ID:', paymentId);

        if (!merchTxnId && !paymentId) {
          setStatus('failed');
          setError('No payment information found');
          return;
        }

        // Dynamic import to avoid SSR issues
        const { apiRequest } = await import('@/lib/api');

        // Wait for callback processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check database first
        if (paymentId) {
          try {
            const dbStatus = await apiRequest<any>(`/api/ndps/status/${paymentId}`);

            console.log('Database status:', dbStatus);

            if (dbStatus?.status === 'paid') {
              setStatus('success');
              setPaymentDetails(dbStatus);
              localStorage.removeItem('ndps_payment_id');
              localStorage.removeItem('ndps_merch_txn_id');
              return;
            } else if (dbStatus?.status === 'failed') {
              setStatus('failed');
              setPaymentDetails(dbStatus);
              return;
            }
          } catch (dbError) {
            console.log('Database check failed, will try requery');
          }
        }

        // Query requery endpoint if still pending
        if (merchTxnId) {
          try {
            console.log('Querying payment status...');
            const gatewayStatus = await apiRequest<any>('/api/ndps/requery', {
              method: 'POST',
              body: JSON.stringify({ merchTxnId })
            });

            console.log('Gateway status:', gatewayStatus);

            if (gatewayStatus?.statusCode === 'OTS0000') {
              setStatus('success');
              setPaymentDetails(gatewayStatus.transactionData || gatewayStatus);
            } else if (gatewayStatus?.statusCode && gatewayStatus.statusCode !== 'OTS0000') {
              setStatus('failed');
              setPaymentDetails(gatewayStatus);
            } else {
              setStatus('pending');
              setPaymentDetails(gatewayStatus);
            }

            localStorage.removeItem('ndps_payment_id');
            localStorage.removeItem('ndps_merch_txn_id');
          } catch (requeryError: any) {
            console.error('Requery failed:', requeryError);
            setStatus('pending');
            setError('Unable to confirm payment status. Please check your order status or contact support.');
          }
        }
      } catch (error: any) {
        console.error('Payment status check error:', error);
        setStatus('failed');
        setError(error.message || 'Failed to verify payment status');
      }
    };

    checkPaymentStatus();
  }, []);

  if (status === 'loading') {
    return (
      <main>
        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: 'var(--brand)' }}></i>
            </div>
            <h2>Verifying Payment...</h2>
            <p style={{ color: 'var(--muted)', marginTop: '15px' }}>
              Please wait while we confirm your payment status.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main>
        <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Payment Successful</h1>
            </div>
          </div>
        </section>

        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <i
              className="fal fa-check-circle"
              style={{ fontSize: '70px', color: '#28a745', marginBottom: '25px', display: 'block' }}
            ></i>
            <h2 style={{ marginBottom: '15px' }}>Payment Completed Successfully!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '30px' }}>
              Your payment has been processed and your order is confirmed.
            </p>
            
            {paymentDetails && (
              <div style={{ 
                maxWidth: '500px', 
                margin: '30px auto', 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <h4 style={{ marginBottom: '15px', textAlign: 'center' }}>Order Details</h4>
                {paymentDetails.orderNumber && (
                  <p><strong>Order Number:</strong> {paymentDetails.orderNumber}</p>
                )}
                {paymentDetails.amount && (
                  <p><strong>Amount Paid:</strong> ₹{paymentDetails.amount}</p>
                )}
                {paymentDetails.paidAt && (
                  <p><strong>Payment Date:</strong> {new Date(paymentDetails.paidAt).toLocaleString()}</p>
                )}
              </div>
            )}

            <div style={{ marginTop: '40px' }}>
              <Link href="/my-orders" className="vs-btn">
                View My Orders
              </Link>
              <Link href="/products" className="vs-btn style2" style={{ marginLeft: '12px' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main>
        <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Payment Failed</h1>
            </div>
          </div>
        </section>

        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <i
              className="fal fa-times-circle"
              style={{ fontSize: '70px', color: '#dc3545', marginBottom: '25px', display: 'block' }}
            ></i>
            <h2 style={{ marginBottom: '15px' }}>Payment Failed</h2>
            <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '10px' }}>
              Unfortunately, your payment could not be processed.
            </p>
            {error && (
              <p style={{ color: '#dc3545', marginBottom: '30px' }}>{error}</p>
            )}
            
            <div style={{ marginTop: '40px' }}>
              <Link href="/cart" className="vs-btn">
                Return to Cart
              </Link>
              <Link href="/products" className="vs-btn style2" style={{ marginLeft: '12px' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Pending status
  return (
    <main>
      <section className="space space-extra-bottom">
        <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <i
            className="fal fa-clock"
            style={{ fontSize: '70px', color: '#ffc107', marginBottom: '25px', display: 'block' }}
          ></i>
          <h2 style={{ marginBottom: '15px' }}>Payment Pending</h2>
          <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '30px' }}>
            Your payment is being processed. Please check your order status after a few minutes.
          </p>
          
          <div style={{ marginTop: '40px' }}>
            <Link href="/my-orders" className="vs-btn">
              View My Orders
            </Link>
            <Link href="/products" className="vs-btn style2" style={{ marginLeft: '12px' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <main>
        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: 'var(--brand)' }}></i>
            </div>
            <h2>Loading...</h2>
          </div>
        </section>
      </main>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}