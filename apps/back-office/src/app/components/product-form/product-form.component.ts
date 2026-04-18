import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    ButtonModule, 
    InputTextModule, 
    InputNumberModule,
    CardModule,
    FloatLabelModule,
    ToastModule
  ],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  
  // Dialog-specific injections (optional)
  public ref = inject(DynamicDialogRef, { optional: true });
  public config = inject(DynamicDialogConfig, { optional: true });

  productForm: FormGroup;
  isEditMode = false;
  isDialog = false;
  loading = signal(false);

  constructor() {
    this.productForm = this.fb.group({
      productId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.ref && this.config) {
        this.isDialog = true;
        if (this.config.data?.id) {
            this.loadProductData(this.config.data.id);
        }
    } else {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadProductData(id);
        }
    }
  }

  private loadProductData(id: string): void {
    this.isEditMode = true;
    this.loading.set(true);
    this.inventoryService.getProducts().subscribe({
        next: (products) => {
            if (products) {
                const product = products.find(p => p.productId === id);
                if (product) {
                    this.productForm.patchValue({
                        productId: product.productId,
                        name: product.name,
                        price: Number(product.price),
                        quantity: Number(product.quantity)
                    });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'SKU Not Found', detail: `The product code ${id} does not exist.` });
                    if (!this.isDialog) this.router.navigate(['/dashboard']);
                }
            }
            this.loading.set(false);
        },
        error: () => {
            this.messageService.add({ severity: 'error', summary: 'Network Failure', detail: 'Could not reach inventory service.' });
            this.loading.set(false);
        }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;
    
    this.loading.set(true);
    const productData = this.productForm.value;
    
    const obs = this.isEditMode 
      ? this.inventoryService.updateProduct(productData.productId, productData)
      : this.inventoryService.createProduct(productData);

    obs.subscribe({
      next: (res) => {
        const success = res?.success ?? true;
        if (success) {
            this.messageService.add({ 
                severity: 'success', 
                summary: this.isEditMode ? 'Stock Updated' : 'SKU Created', 
                detail: `System has synchronized ${productData.productId} successfully.` 
            });
            
            if (this.isDialog) {
                setTimeout(() => this.ref?.close(true), 800);
            } else {
                setTimeout(() => this.router.navigate(['/dashboard']), 1200);
            }
        } else {
            this.messageService.add({ severity: 'error', summary: 'System Rejected', detail: res?.message || 'Operation failed.' });
            this.loading.set(false);
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Execution Error', detail: err.error?.message || err.message });
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    if (this.isDialog) {
        this.ref?.close(false);
    } else {
        this.router.navigate(['/dashboard']);
    }
  }
}
