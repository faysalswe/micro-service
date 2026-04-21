import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, RefundResponse } from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/payments`; // Proxied through Kong to PaymentService
  private http = inject(HttpClient);

  getPayments(userId?: string, orderId?: string): Observable<Payment[]> {
    let url = this.apiUrl;
    const params = [];
    if (userId) params.push(`userId=${userId}`);
    if (orderId) params.push(`orderId=${orderId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    return this.http.get<Payment[]>(url);
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  refundPayment(id: string, reason: string): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(`${this.apiUrl}/${id}/refund`, { reason });
  }
}
