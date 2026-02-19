import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    TableModule, 
    ButtonModule, 
    TagModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  template: `
    <div class="card p-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Inventory Dashboard</h1>
          <p class="text-gray-500 mt-1">Manage your dynamic product catalog and stock levels.</p>
        </div>
        <p-button label="Add New Product" icon="pi pi-plus" routerLink="/products/new" severity="primary"></p-button>
      </div>

      <p-table 
        [value]="products" 
        [paginator]="true" 
        [rows]="10" 
        [showCurrentPageReport]="true"
        [responsiveLayout]="'scroll'"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        [rowsPerPageOptions]="[10, 25, 50]"
        styleClass="p-datatable-striped shadow-md rounded-lg overflow-hidden"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="productID" class="bg-gray-50">ID <p-sortIcon field="productID"></p-sortIcon></th>
            <th pSortableColumn="name" class="bg-gray-50">Product Name <p-sortIcon field="name"></p-sortIcon></th>
            <th pSortableColumn="price" class="bg-gray-50">Price <p-sortIcon field="price"></p-sortIcon></th>
            <th pSortableColumn="quantity" class="bg-gray-50">Stock Level <p-sortIcon field="quantity"></p-sortIcon></th>
            <th class="bg-gray-50">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-product>
          <tr>
            <td class="font-medium text-gray-700">{{product.productID}}</td>
            <td>{{product.name}}</td>
            <td>{{product.price | currency}}</td>
            <td>
              <p-tag 
                [value]="product.quantity.toString()" 
                [severity]="getSeverity(product.quantity)"
                class="font-semibold"
              ></p-tag>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" [routerLink]="['/products/edit', product.productID]"></p-button>
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteProduct(product.productID)"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="text-center py-8 text-gray-500">
              No products found. Start by adding a new product.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error loading products', err)
    });
  }

  getSeverity(quantity: number): "success" | "secondary" | "info" | "warn" | "danger" | undefined {
    if (quantity > 20) return 'success';
    if (quantity > 0) return 'warn';
    return 'danger';
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.inventoryService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          alert('Error deleting product: ' + err.message);
        }
      });
    }
  }
}
