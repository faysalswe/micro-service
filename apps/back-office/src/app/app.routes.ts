import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },

  { path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      { path: 'orders',
        loadComponent: () => import('./components/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      { path: 'orders/:id',
        loadComponent: () => import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },

      // Admin + Manager only
      { path: 'payments',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Manager'] },
        loadComponent: () => import('./components/payment-list/payment-list.component').then(m => m.PaymentListComponent)
      },
      { path: 'products',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Manager'] },
        loadComponent: () => import('./components/product-list/product-list.component').then(m => m.ProductListComponent)
      },

      // Admin only
      { path: 'products/new',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      { path: 'products/edit/:id',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      { path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
