import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, SagaLog } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/orders`; // Proxied through Kong to OrderService
  private http = inject(HttpClient);

  getOrders(userId?: string): Observable<Order[]> {
    const url = userId ? `${this.apiUrl}?userId=${userId}` : this.apiUrl;
    return this.http.get<Order[]>(url);
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  getSagaHistory(id: string): Observable<SagaLog[]> {
    return this.http.get<SagaLog[]>(`${this.apiUrl}/${id}/saga`);
  }

  cancelOrder(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
