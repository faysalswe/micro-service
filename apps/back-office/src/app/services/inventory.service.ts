import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product, ApiResponse } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory/active-products`; // Proxied through Kong
  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        // Huma v2 usually unwraps the Body field into the root of the JSON response
        if (Array.isArray(res)) return res;
        return res?.body || res?.Body || [];
      })
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        // If it's not a wrapped object, return the response itself
        if (res && res.productId) return res;
        return res?.body || res?.Body;
      })
    );
  }

  createProduct(product: Product): Observable<any> {
    return this.http.post<any>(this.apiUrl, product).pipe(
      map(res => res?.body || res?.Body || res)
    );
  }

  updateProduct(id: string, product: Partial<Product>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, product).pipe(
      map(res => res?.body || res?.Body || res)
    );
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res?.body || res?.Body || res)
    );
  }
}
