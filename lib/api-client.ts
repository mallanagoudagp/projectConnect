// API configuration for connecting to your FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Generic API client with error handling
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async health() {
    return this.request<{ status: string }>('/health');
  }

  // Payment endpoints
  async createPayment(data: {
    subscription_id: number;
    amount: number;
    gateway_id: string;
  }) {
    return this.request<{
      id: number;
      subscription_id: number;
      amount: number;
      status: string;
      gateway_id: string;
      idempotency_key: string;
    }>('/payments/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approvePayment(paymentId: number, idempotencyKey: string) {
    return this.request<{
      id: number;
      status: string;
      amount: number;
    }>(`/payments/${paymentId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ idempotency_key: idempotencyKey }),
    });
  }

  async refundPayment(paymentId: number, idempotencyKey: string) {
    return this.request<{
      id: number;
      status: string;
      amount: number;
    }>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ idempotency_key: idempotencyKey }),
    });
  }

  // Notification endpoints
  async createNotification(data: {
    family_id: number;
    type: string;
    message: string;
    data?: any;
  }) {
    return this.request<{
      id: number;
      family_id: number;
      type: string;
      message: string;
      data: any;
    }>('/notifications/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(familyId: number) {
    return this.request<Array<{
      id: number;
      family_id: number;
      type: string;
      message: string;
      data: any;
    }>>(`/notifications/family/${familyId}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Type definitions
export interface Payment {
  id: number;
  subscription_id: number;
  amount: number;
  status: string;
  gateway_id: string;
  idempotency_key?: string;
}

export interface Notification {
  id: number;
  family_id: number;
  type: string;
  message: string;
  data: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
