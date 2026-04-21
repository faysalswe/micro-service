import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order, SagaLog } from '../../models/order.model';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  
  orderId = '';
  order?: Order;
  sagaHistory: SagaLog[] = [];
  loading = true;

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.orderService.getOrder(this.orderId).subscribe(data => {
      this.order = data;
    });
    
    this.orderService.getSagaHistory(this.orderId).subscribe(data => {
      this.sagaHistory = data;
      this.loading = false;
    });
  }

  getStepIcon(status: string): string {
    return status === 'Completed' ? 'pi pi-check-circle text-success' : 
           status === 'Failed' ? 'pi pi-times-circle text-danger' : 
           'pi pi-clock text-warning';
  }
}
