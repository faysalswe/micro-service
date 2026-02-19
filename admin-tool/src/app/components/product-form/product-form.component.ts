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
    <div style="max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div class="flex items-center gap-3" style="margin-bottom: var(--space-8);">
        <p-button icon="pi pi-chevron-left" [text]="true" routerLink="/" severity="secondary" 
                  styleClass="card-base" [style]="{'padding': 'var(--space-4)', 'background': 'white'}"></p-button>
        <div>
            <h2 class="title-page">
              {{ isEditMode ? 'Edit Product' : 'New Product Entry' }}
            </h2>
            <p class="subtitle-page">Configure inventory details for the global catalog.</p>
        </div>
      </div>

      <div class="card-base">
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-10">
          
          <div class="flex flex-col gap-6">
            <h3 class="section-title">General Information</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-8);">
                <div class="flex flex-col gap-2">
                    <p-floatlabel variant="on">
                        <input pInputText id="productID" formControlName="productID" [readOnly]="isEditMode" class="w-full" style="padding: var(--space-4);" />
                        <label for="productID">SKU Identifier</label>
                    </p-floatlabel>
                    <small style="color: var(--error); font-weight: 600; padding-left: var(--space-2);" *ngIf="productForm.get('productID')?.invalid && productForm.get('productID')?.touched">SKU is required.</small>
                </div>

                <div class="flex flex-col gap-2">
                    <p-floatlabel variant="on">
                        <input pInputText id="name" formControlName="name" class="w-full" style="padding: var(--space-4);" />
                        <label for="name">Product Name</label>
                    </p-floatlabel>
                    <small style="color: var(--error); font-weight: 600; padding-left: var(--space-2);" *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched">Name is required.</small>
                </div>
            </div>
          </div>

          <div class="flex flex-col gap-6">
            <h3 class="section-title" style="border-left-color: var(--success);">Inventory & Pricing</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-8);">
                <div class="flex flex-col gap-2">
                    <p-floatlabel variant="on">
                        <p-inputNumber 
                            id="price" 
                            formControlName="price" 
                            mode="currency" 
                            currency="USD" 
                            locale="en-US" 
                            styleClass="w-full"
                            inputStyleClass="w-full"
                            [inputStyle]="{'padding': 'var(--space-4)'}"
                        ></p-inputNumber>
                        <label for="price">Unit Price</label>
                    </p-floatlabel>
                </div>

                <div class="flex flex-col gap-2">
                    <p-floatlabel variant="on">
                        <p-inputNumber 
                            id="quantity" 
                            formControlName="quantity" 
                            [showButtons]="true" 
                            [min]="0"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                            [inputStyle]="{'padding': 'var(--space-4)'}"
                        ></p-inputNumber>
                        <label for="quantity">Stock Quantity</label>
                    </p-floatlabel>
                </div>
            </div>
          </div>

          <div class="flex justify-between items-center" style="padding-top: var(--space-8); border-top: 1px solid var(--slate-100);">
            <p-button label="Cancel" severity="secondary" [text]="true" routerLink="/"></p-button>
            <p-button 
                [label]="loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')" 
                [icon]="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"
                type="submit" 
                [disabled]="productForm.invalid || loading"
                severity="primary"
                [style]="{'padding': 'var(--space-4) var(--space-10)', 'font-weight': '700'}"
            ></p-button>
          </div>
        </form>
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
        next: () => this.router.navigate(['/']),
        error: (err) => { alert('Error updating product: ' + err.message); this.loading = false; }
      });
    } else {
      this.inventoryService.createProduct(productData).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => { alert('Error creating product: ' + err.message); this.loading = false; }
      });
    }
  }
}
