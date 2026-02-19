import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-indigo-700 shadow-lg border-b border-indigo-800">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-2">
                <i class="pi pi-box text-white text-2xl"></i>
                <span class="text-white font-black text-xl tracking-tight">INVENTORY<span class="text-indigo-300">CORE</span></span>
              </div>
              <div class="hidden md:block">
                <div class="flex items-baseline space-x-2">
                  <p-button label="Dashboard" icon="pi pi-home" [text]="true" routerLink="/" styleClass="text-white hover:bg-indigo-600 px-3 py-2 text-sm font-medium"></p-button>
                  <p-button label="Add Product" icon="pi pi-plus-circle" [text]="true" routerLink="/products/new" styleClass="text-indigo-100 hover:bg-indigo-600 hover:text-white px-3 py-2 text-sm font-medium"></p-button>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="hidden sm:flex flex-col items-end">
                <span class="text-white text-xs font-bold uppercase tracking-widest">Admin Portal</span>
                <span class="text-indigo-300 text-[10px]">v1.0.0-PRO</span>
              </div>
              <p-button icon="pi pi-user" [rounded]="true" severity="secondary" styleClass="bg-indigo-800 border-none text-white"></p-button>
            </div>
          </div>
        </div>
      </nav>

      <main class="py-10">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <router-outlet></router-outlet>
        </div>
      </main>

      <footer class="bg-white border-t border-gray-200 py-6 mt-auto">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p class="text-gray-400 text-xs">© 2026 InventoryCore Microservices Demo. All rights reserved.</p>
          <div class="flex gap-4">
            <i class="pi pi-github text-gray-400 hover:text-gray-600 cursor-pointer"></i>
            <i class="pi pi-discord text-gray-400 hover:text-gray-600 cursor-pointer"></i>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {
  title = 'Inventory Admin';
}
