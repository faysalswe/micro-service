import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { 
    path: '', 
    component: ProductListComponent,
    canActivate: [roleGuard]
  },
  { 
    path: 'products/new', 
    component: ProductFormComponent,
    canActivate: [roleGuard]
  },
  { 
    path: 'products/edit/:id', 
    component: ProductFormComponent,
    canActivate: [roleGuard]
  },
  { path: '**', redirectTo: '' }
];
