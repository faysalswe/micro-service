import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../models/payment.model';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    TagModule, 
    ButtonModule, 
    TooltipModule
  ],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.css'
})
export class PaymentListComponent implements OnInit {
  private paymentService = inject(PaymentService);
  payments: Payment[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getPayments().subscribe({
      next: (data) => {
        this.payments = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load payments';
        this.loading = false;
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warn';
      case 'REFUNDED': return 'info';
      case 'FAILED': return 'danger';
      default: return 'secondary';
    }
  }

  refund(id: string): void {
    const reason = prompt('Reason for refund?');
    if (reason) {
      this.paymentService.refundPayment(id, reason).subscribe({
        next: () => this.loadPayments(),
        error: (err) => alert('Refund failed')
      });
    }
  }
}
