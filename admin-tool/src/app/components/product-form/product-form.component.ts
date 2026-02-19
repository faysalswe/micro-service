import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';

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
    FloatLabelModule
  ],
  template: `
    <div class="max-w-3xl mx-auto py-12 px-4">
      <div class="mb-8 flex items-center gap-4">
        <p-button icon="pi pi-arrow-left" [text]="true" routerLink="/"></p-button>
        <h2 class="text-3xl font-bold text-gray-900">
          {{ isEditMode ? 'Edit Product Details' : 'Onboard New Product' }}
        </h2>
      </div>

      <p-card styleClass="shadow-lg border-t-4 border-indigo-600">
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-8 p-4">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <p-floatlabel variant="on">
                <input pInputText id="productID" formControlName="productID" [readOnly]="isEditMode" class="w-full" />
                <label for="productID">Product Identifier (SKU)</label>
            </p-floatlabel>

            <p-floatlabel variant="on">
                <input pInputText id="name" formControlName="name" class="w-full" />
                <label for="name">Commercial Name</label>
            </p-floatlabel>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <p-floatlabel variant="on">
                <p-inputNumber 
                    id="price" 
                    formControlName="price" 
                    mode="currency" 
                    currency="USD" 
                    locale="en-US" 
                    styleClass="w-full"
                    inputStyleClass="w-full"
                ></p-inputNumber>
                <label for="price">Unit Price</label>
            </p-floatlabel>

            <p-floatlabel variant="on">
                <p-inputNumber 
                    id="quantity" 
                    formControlName="quantity" 
                    [showButtons]="true" 
                    [min]="0"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                ></p-inputNumber>
                <label for="quantity">Initial Inventory Level</label>
            </p-floatlabel>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <p-button 
                label="Cancel" 
                severity="secondary" 
                [text]="true" 
                routerLink="/"
                [disabled]="loading"
            ></p-button>
            <p-button 
                [label]="loading ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Create Product')" 
                [icon]="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                type="submit" 
                [disabled]="productForm.invalid || loading"
                severity="primary"
            ></p-button>
          </div>
        </form>
      </p-card>

      <div class="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <div class="flex gap-3">
          <i class="pi pi-info-circle text-indigo-600 mt-1"></i>
          <div>
            <h4 class="text-indigo-900 font-semibold text-sm">Real-time Synchronization</h4>
            <p class="text-indigo-700 text-xs mt-1">
              Changes made here are persisted directly to the PostgreSQL database in the <strong>Go Inventory Service</strong>. 
              These changes will immediately appear in the React Customer App.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      productID: ['', [Validators.required]],
      name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loading = true;
      this.inventoryService.getProducts().subscribe(products => {
        const product = products.find(p => p.productID === id);
        if (product) {
          this.productForm.patchValue(product);
        }
        this.loading = false;
      });
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.loading = true;
    const productData = this.productForm.value;

    if (this.isEditMode) {
      this.inventoryService.updateProduct(productData.productID, productData).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          alert('Error updating product: ' + err.message);
          this.loading = false;
        }
      });
    } else {
      this.inventoryService.createProduct(productData).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          alert('Error creating product: ' + err.message);
          this.loading = false;
        }
      });
    }
  }
}
