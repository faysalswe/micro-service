import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, TooltipModule],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Header Section: Rearranged -->
      <div class="flex justify-between items-center w-full" style="margin-bottom: var(--space-4);">
        <p-button label="Add Product" icon="pi pi-plus" routerLink="/products/new" severity="primary"></p-button>
        
        <div style="text-align: center;">
          <h1 class="title-page">Inventory Dashboard</h1>
          <p class="subtitle-page">Monitor and manage global stock levels.</p>
        </div>

        <p-button label="Refresh" icon="pi pi-refresh" [text]="true" (click)="loadProducts()" severity="secondary"></p-button>
      </div>

      <!-- Stats Grid -->
      <div class="stat-grid">
        <div class="card-base flex items-center gap-3">
            <div class="stat-icon blue"><i class="pi pi-box"></i></div>
            <div>
                <p class="stat-label">Total Items</p>
                <p class="stat-value">{{products().length}}</p>
            </div>
        </div>

        <div class="card-base flex items-center gap-3">
            <div class="stat-icon green"><i class="pi pi-dollar"></i></div>
            <div>
                <p class="stat-label">Total Value</p>
                <p class="stat-value">{{totalValue() | currency}}</p>
            </div>
        </div>

        <div class="card-base flex items-center gap-3">
            <div class="stat-icon amber"><i class="pi pi-exclamation-triangle"></i></div>
            <div>
                <p class="stat-label">Low Stock</p>
                <p class="stat-value">{{lowStockCount()}}</p>
            </div>
        </div>

        <div class="card-base flex items-center gap-3">
            <div class="stat-icon red"><i class="pi pi-times-circle"></i></div>
            <div>
                <p class="stat-label">Out of Stock</p>
                <p class="stat-value">{{outOfStockCount()}}</p>
            </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="card-base" style="padding: 0; overflow: hidden;">
        <p-table 
            [value]="products()" 
            [paginator]="true" 
            [rows]="10" 
            [showCurrentPageReport]="true"
            responsiveLayout="scroll"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            [rowsPerPageOptions]="[10, 25, 50]"
        >
            <ng-template pTemplate="header">
            <tr>
                <th pSortableColumn="productID" style="padding: 1.25rem 1rem;">SKU <p-sortIcon field="productID"></p-sortIcon></th>
                <th pSortableColumn="name">Product Name <p-sortIcon field="name"></p-sortIcon></th>
                <th pSortableColumn="price">Unit Price <p-sortIcon field="price"></p-sortIcon></th>
                <th pSortableColumn="quantity">Inventory <p-sortIcon field="quantity"></p-sortIcon></th>
                <th style="width: 100px;">Actions</th>
            </tr>
            </ng-template>
            <ng-template pTemplate="body" let-product>
            <tr>
                <td style="font-family: var(--font-mono); font-weight: 600; color: var(--primary-color);">{{product.productID}}</td>
                <td style="font-weight: 500;">{{product.name}}</td>
                <td style="font-weight: 700;">{{product.price | currency}}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <p-tag [value]="product.quantity.toString()" [severity]="getSeverity(product.quantity)"></p-tag>
                        <span style="font-size: var(--text-xs); font-weight: 700; color: var(--error); text-transform: uppercase;" *ngIf="product.quantity === 0">Restock!</span>
                    </div>
                </td>
                <td>
                    <div class="flex">
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" [routerLink]="['/products/edit', product.productID]" pTooltip="Edit"></p-button>
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteProduct(product.productID)" pTooltip="Delete"></p-button>
                    </div>
                </td>
            </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
            <tr>
                <td colspan="5" style="padding: 4rem; text-align: center;">
                    <i class="pi pi-inbox" style="font-size: 3rem; color: var(--slate-200); margin-bottom: var(--space-4); display: block;"></i>
                    <p style="color: var(--text-secondary); font-weight: 600; margin: 0;">Inventory is currently empty.</p>
                    <p-button label="Add Product" [text]="true" routerLink="/products/new" styleClass="mt-2"></p-button>
                </td>
            </tr>
            </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .stat-icon.blue { background: var(--brand-50); color: var(--brand-500); }
    .stat-icon.green { background: #ecfdf5; color: var(--success); }
    .stat-icon.amber { background: #fffbeb; color: var(--warning); }
    .stat-icon.red { background: #fef2f2; color: var(--error); }

    .stat-label { margin: 0; font-size: var(--text-xs); font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
    .stat-value { margin: 0; font-size: var(--text-2xl); font-weight: 800; }
  `]
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  totalValue = computed(() => this.products().reduce((sum, p) => sum + (p.price * p.quantity), 0));
  lowStockCount = computed(() => this.products().filter(p => p.quantity > 0 && p.quantity < 10).length);
  outOfStockCount = computed(() => this.products().filter(p => p.quantity === 0).length);

  constructor(private inventoryService: InventoryService) {}
  ngOnInit(): void { this.loadProducts(); }
  loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Error loading products', err)
    });
  }
  getSeverity(quantity: number): "success" | "secondary" | "info" | "warn" | "danger" | undefined {
    if (quantity >= 20) return 'success';
    if (quantity > 0) return 'warn';
    return 'danger';
  }
  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.inventoryService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => alert('Error deleting product: ' + err.message)
      });
    }
  }
}
