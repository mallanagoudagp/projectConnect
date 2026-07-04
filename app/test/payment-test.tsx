"use client";

import { useState } from "react";

interface Payment {
  id: number;
  subscription_id: number;
  amount: number;
  status: string;
  gateway_id: string;
}

export function PaymentTestPage() {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE = "http://localhost:8000";

  const createPayment = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch(`${API_BASE}/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_id: 1,
          amount: 100.0,
          gateway_id: "frontend_test"
        })
      });
      
      if (response.ok) {
        const newPayment = await response.json();
        setPayment(newPayment);
        setMessage(`Payment created! ID: ${newPayment.id}`);
      } else {
        setMessage("Failed to create payment");
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async () => {
    if (!payment) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch(`${API_BASE}/payments/${payment.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotency_key: `approve-${payment.id}-${Date.now()}`
        })
      });
      
      if (response.ok) {
        const updatedPayment = await response.json();
        setPayment({ ...payment, status: updatedPayment.status });
        setMessage("Payment approved!");
      } else {
        setMessage("Failed to approve payment");
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async () => {
    if (!payment) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch(`${API_BASE}/payments/${payment.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotency_key: `refund-${payment.id}-${Date.now()}`
        })
      });
      
      if (response.ok) {
        const updatedPayment = await response.json();
        setPayment({ ...payment, status: updatedPayment.status });
        setMessage("Payment refunded!");
      } else {
        setMessage("Failed to refund payment");
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Payment API Test</h1>
      
      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create Payment</h2>
          <button
            onClick={createPayment}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Payment"}
          </button>
        </div>

        {payment && (
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div className="space-y-2 mb-4">
              <p><strong>ID:</strong> {payment.id}</p>
              <p><strong>Amount:</strong> ${payment.amount}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                  payment.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payment.status.toUpperCase()}
                </span>
              </p>
              <p><strong>Gateway:</strong> {payment.gateway_id}</p>
            </div>
            
            <div className="space-x-2">
              <button
                onClick={approvePayment}
                disabled={loading || payment.status !== 'pending'}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={refundPayment}
                disabled={loading || payment.status !== 'approved'}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                Refund
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`border rounded-lg p-4 ${
            message.includes('Error') || message.includes('Failed')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
