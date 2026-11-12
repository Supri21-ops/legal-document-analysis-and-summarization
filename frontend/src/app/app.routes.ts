import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./pages/documents/documents.component').then(m => m.DocumentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents/:id',
    loadComponent: () => import('./pages/document-detail/document-detail.component').then(m => m.DocumentDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'blockchain',
    loadComponent: () => import('./pages/blockchain/blockchain.component').then(m => m.BlockchainComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
