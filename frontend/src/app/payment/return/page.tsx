"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get merchant transaction ID from localStorage or URL params
        const merchTxnId = localStorage.getItem('ndps_merch_txn_id') || searchParams.get('merchTxnId');
        const paymentId = localStorage.getItem('ndps_payment_id') || searchParams.get('paymentId');

        console.log('Checking payment status...');
        console.log('Merchant Txn ID:', merchTxnId);
        console.log('Payment ID:', paymentId);

        if (!merchTxnId && !paymentId) {
          setStatus('failed');
          setError('No payment information found');
          return;
        }

        // Wait a moment for the callback to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // First, try to check via our database
        if (paymentId) {
          try {
            const dbStatus = await apiRequest<{
              paymentId: number;
              orderId: number;
              orderNumber: string;
              status: string;
              amount: number;
              paidAt: string | null;
            }>(`/api/ndps/status/${paymentId}`);

            console.log('Database status:', dbStatus);

            if (dbStatus.status === 'paid') {
              setStatus('success');
              setPaymentDetails(dbStatus);
              // Clear localStorage
              localStorage.removeItem('ndps_payment_id');
              localStorage.removeItem('ndps_merch_txn_id');
              return;
            } else if (dbStatus.status === 'failed') {
              setStatus('failed');
              setPaymentDetails(dbStatus);
              return;
            }
          } catch (dbError) {
            console.log('Database check failed, trying requery...');
          }
        }

        // If database status is still pending, query NTT API directly
        if (merchTxnId) {
          try {
            console.log('Querying NTT API for status...');
            const gatewayStatus = await apiRequest<{
              merchTxnId: string;
              statusCode: string;
              statusMessage: string;
              transactionData: any;
              source: string;
            }>('/api/ndps/requery', {
              method: 'POST',
              body: JSON.stringify({ merchTxnId })
            });

            console.log('Gateway status:', gatewayStatus);

            if (gatewayStatus.statusCode === 'OTS0000') {
              setStatus('success');
              setPaymentDetails(gatewayStatus.transactionData);
            } else if (gatewayStatus.statusCode && gatewayStatus.statusCode !== 'OTS0000') {
              setStatus('failed');
              setPaymentDetails(gatewayStatus);
            } else {
              setStatus('pending');
              setPaymentDetails(gatewayStatus);
            }

            // Clear localStorage
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
  }, [searchParams]);

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
        <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuwB_fJjOi4hX4YlC-mm76lRdTPTXJEMgZJM0HdFEaNcfOcC_V1EG6OQk&s=10')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
        <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuwB_fJjOi4hX4YlC-mm76lRdTPTXJEMgZJM0HdFEaNcfOcC_V1EG6OQk&s=10')", backgroundSize: "cover", backgroundPosition: "center" }}>
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