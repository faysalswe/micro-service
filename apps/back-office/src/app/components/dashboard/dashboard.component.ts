import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { OrderService } from '../../services/order.service';
import { InventoryService } from '../../services/inventory.service';
import { forkJoin } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private inventoryService = inject(InventoryService);

  stats = {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0
  };

  chartData: any;
  chartOptions: any;
  loading = true;

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    forkJoin({
      users: this.userService.getUsers(),
      orders: this.orderService.getOrders(),
      products: this.inventoryService.getProducts()
    }).subscribe({
      next: (data) => {
        this.stats.totalUsers = data.users.length;
        this.stats.totalOrders = data.orders.length;
        this.stats.totalRevenue = data.orders.reduce((acc, curr) => acc + curr.amount, 0);
        this.stats.activeProducts = data.products.length;
        
        this.initChart(data.orders);
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard stats failed', err);
        this.loading = false;
      }
    });
  }

  initChart(orders: any[]): void {
    // Simple grouping by day for the last 7 orders
    const labels = orders.slice(0, 7).reverse().map(o => new Date(o.createdAt).toLocaleDateString());
    const values = orders.slice(0, 7).reverse().map(o => o.amount);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Revenue Trend',
          data: values,
          fill: true,
          borderColor: '#3b82f6',
          tension: 0.4,
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
  }
}
