import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // Public Route: Login
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  
  // Protected Routes: Wrapped in MainLayout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/product-list/product-list.component').then(m => m.ProductListComponent) 
      },
      { 
        path: 'products/new', 
        loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent) 
      },
      { 
        path: 'products/edit/:id', 
        loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent) 
      }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
