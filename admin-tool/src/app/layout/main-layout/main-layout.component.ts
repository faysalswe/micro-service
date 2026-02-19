import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, MenuModule, AvatarModule],
  template: `
    <div class="layout-shell">
      <!-- Standard Professional Sidebar -->
      <aside class="layout-sidebar" [class.is-active]="isSidebarVisible()">
        <div class="sidebar-branding">
          <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
            <i class="pi pi-box brand-icon"></i>
            <span class="brand-text">InventoryCore</span>
          </div>
          <p-button icon="pi pi-times" [text]="true" styleClass="u-mobile-only" (click)="toggleSidebar()"></p-button>
        </div>

        <nav class="sidebar-navigation">
          <div class="menu-category">Main Console</div>
          <a routerLink="/dashboard" routerLinkActive="is-active" class="menu-item">
            <i class="pi pi-chart-bar"></i><span>Dashboard</span>
          </a>
          
          <div class="menu-category">Inventory</div>
          <a routerLink="/products/new" routerLinkActive="is-active" class="menu-item">
            <i class="pi pi-plus-circle"></i><span>Add New SKU</span>
          </a>
          <a class="menu-item is-disabled"><i class="pi pi-tags"></i><span>Categories</span></a>

          <div class="menu-category">Operations</div>
          <a class="menu-item is-disabled"><i class="pi pi-shopping-cart"></i><span>Active Orders</span></a>
        </nav>

        <div class="sidebar-status" style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <span style="font-size: 0.65rem; color: #475569; font-weight: 700;">v1.0.0-OS</span>
        </div>
      </aside>

      <!-- Standard Content Wrapper -->
      <div class="layout-main-wrapper">
        <header class="app-header">
          <div class="header-left">
            <p-button icon="pi pi-bars" [text]="true" styleClass="u-mobile-only" (click)="toggleSidebar()"></p-button>
            <div class="header-search u-desktop-only">
                <i class="pi pi-search"></i>
                <input type="text" placeholder="Quick Search..." />
            </div>
          </div>

          <div class="header-spacer"></div>

          <!-- Stable User Section -->
          <div class="header-right" *ngIf="authService.isAuthenticated()">
            <div class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors" (click)="menu.toggle($event)">
                <div class="user-meta u-desktop-only">
                    <span class="user-name">Admin User</span>
                    <span class="user-role">{{authService.currentUserRole()}}</span>
                </div>
                <p-avatar 
                    icon="pi pi-user" 
                    styleClass="user-avatar-trigger" 
                    shape="circle"
                ></p-avatar>
            </div>
            <p-menu #menu [model]="userMenuItems" [popup]="true" appendTo="body"></p-menu>
          </div>
        </header>

        <!-- Main Dynamic Content -->
        <main class="app-content">
          <router-outlet></router-outlet>
        </main>

        <footer class="app-footer">
          <span class="copyright-text">© 2026 InventoryCore OS. Managed Microservices Architecture.</span>
        </footer>
      </div>

      <!-- Backdrop for mobile -->
      <div class="layout-backdrop" *ngIf="isSidebarVisible()" (click)="toggleSidebar()" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1050;"></div>
    </div>
  `
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  router = inject(Router);
  isSidebarVisible = signal(false);

  userMenuItems: MenuItem[] = [
    { label: 'Management', items: [{ label: 'Profile', icon: 'pi pi-user' }, { label: 'Settings', icon: 'pi pi-cog' }] },
    { label: 'Security', items: [{ label: 'Sign Out', icon: 'pi pi-power-off', command: () => this.logout() }] }
  ];

  toggleSidebar() { this.isSidebarVisible.set(!this.isSidebarVisible()); }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
