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
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'products/new', 
        loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent) 
      },
      { 
        path: 'products/edit/:id', 
        loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent) 
      },
      { 
        path: 'products', 
        loadComponent: () => import('./components/product-list/product-list.component').then(m => m.ProductListComponent) 
      },
      { 
        path: 'users', 
        loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent) 
      },
      { 
        path: 'orders', 
        loadComponent: () => import('./components/order-list/order-list.component').then(m => m.OrderListComponent) 
      },
      { 
        path: 'orders/:id', 
        loadComponent: () => import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent) 
      },
      { 
        path: 'payments', 
        loadComponent: () => import('./components/payment-list/payment-list.component').then(m => m.PaymentListComponent) 
      },
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
