'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, type Payment } from '@/lib/api-client';

export function PaymentManager() {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [amount, setAmount] = useState('100');
  const [gatewayId, setGatewayId] = useState('stripe_frontend');

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const createPayment = async () => {
    clearMessages();
    setLoading(true);
    
    try {
      const newPayment = await apiClient.createPayment({
        subscription_id: 1,
        amount: parseFloat(amount),
        gateway_id: gatewayId,
      });
      
      setPayment(newPayment);
      setSuccess(`Payment created successfully! ID: ${newPayment.id}`);
    } catch (err) {
      setError(`Failed to create payment: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async () => {
    if (!payment) return;
    
    clearMessages();
    setLoading(true);
    
    try {
      const idempotencyKey = `approve-${payment.id}-${Date.now()}`;
      const approvedPayment = await apiClient.approvePayment(payment.id, idempotencyKey);
      
      setPayment({ ...payment, status: approvedPayment.status });
      setSuccess('Payment approved successfully!');
    } catch (err) {
      setError(`Failed to approve payment: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async () => {
    if (!payment) return;
    
    clearMessages();
    setLoading(true);
    
    try {
      const idempotencyKey = `refund-${payment.id}-${Date.now()}`;
      const refundedPayment = await apiClient.refundPayment(payment.id, idempotencyKey);
      
      setPayment({ ...payment, status: refundedPayment.status });
      setSuccess('Payment refunded successfully!');
    } catch (err) {
      setError(`Failed to refund payment: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'refunded': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>
            Test your FastAPI backend payment system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div>
              <Label htmlFor="gateway">Gateway ID</Label>
              <Input
                id="gateway"
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value)}
                placeholder="stripe_frontend"
              />
            </div>
          </div>

          <Button 
            onClick={createPayment} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Payment'}
          </Button>

          {payment && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment Details
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ID:</strong> {payment.id}
                  </div>
                  <div>
                    <strong>Amount:</strong> ${payment.amount}
                  </div>
                  <div>
                    <strong>Gateway:</strong> {payment.gateway_id}
                  </div>
                  <div>
                    <strong>Subscription:</strong> {payment.subscription_id}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={approvePayment}
                    disabled={loading || payment.status !== 'pending'}
                    variant="outline"
                    size="sm"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={refundPayment}
                    disabled={loading || payment.status !== 'approved'}
                    variant="outline"
                    size="sm"
                  >
                    Refund
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
