import { Component, OnInit, computed, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    TableModule, 
    ButtonModule, 
    TagModule, 
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    DynamicDialogModule
  ],
  templateUrl: './product-list.component.html',
  providers: [DialogService]
})
export class ProductListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  
  @ViewChild('dt') table?: Table;
  
  products = signal<Product[]>([]);
  loading = signal(false);
  ref: DynamicDialogRef | undefined;
  
  totalValue = computed(() => {
    const list = this.products();
    if (!list) return 0;
    return list.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  });

  lowStockCount = computed(() => {
    const list = this.products();
    if (!list) return 0;
    return list.filter(p => p.quantity > 0 && p.quantity < 10).length;
  });

  outOfStockCount = computed(() => {
    const list = this.products();
    if (!list) return 0;
    return list.filter(p => p.quantity === 0).length;
  });

  ngOnInit(): void { 
    this.loadProducts(); 
  }

  loadProducts(): void {
    this.loading.set(true);
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ 
            severity: 'error', 
            summary: 'System Connectivity Issue', 
            detail: 'Failed to synchronize with inventory backend.' 
        });
        this.loading.set(false);
        this.products.set([]);
      }
    });
  }

  openCreateModal() {
    this.ref = this.dialogService.open(ProductFormComponent, {
        header: 'Register New Inventory Item',
        width: '50vw',
        contentStyle: { overflow: 'auto' },
        breakpoints: {
            '960px': '75vw',
            '640px': '90vw'
        },
        data: {
            id: null
        }
    });

    this.ref.onClose.subscribe((success: boolean) => {
        if (success) {
            this.loadProducts();
        }
    });
  }

  openEditModal(id: string) {
    this.ref = this.dialogService.open(ProductFormComponent, {
        header: 'Modify Inventory Record',
        width: '50vw',
        contentStyle: { overflow: 'auto' },
        breakpoints: {
            '960px': '75vw',
            '640px': '90vw'
        },
        data: {
            id: id
        }
    });

    this.ref.onClose.subscribe((success: boolean) => {
        if (success) {
            this.loadProducts();
        }
    });
  }

  onFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.table) {
      this.table.filterGlobal(input.value, 'contains');
    }
  }

  getSeverity(quantity: number): "success" | "secondary" | "info" | "warn" | "danger" | undefined {
    if (quantity >= 20) return 'success';
    if (quantity > 0) return 'warn';
    return 'danger';
  }

  deleteProduct(id: string): void {
    if (confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this SKU?')) {
      this.inventoryService.deleteProduct(id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Record Deleted', detail: `SKU ${id} has been removed.` });
          this.loadProducts();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: err.message });
        }
      });
    }
  }
}
