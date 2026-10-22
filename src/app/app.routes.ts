import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'search', loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent) },
  { path: 'business/:slug', loadComponent: () => import('./features/business/business.component').then(m => m.BusinessComponent) },
  { path: 'category/:id', loadComponent: () => import('./features/category/category.component').then(m => m.CategoryComponent) },
  { path: 'categories', loadComponent: () => import('./features/category/categories.component').then(m => m.CategoriesComponent) },
  { path: 'city/:state/:city', loadComponent: () => import('./features/city/city.component').then(m => m.CityComponent) },
  { path: 'cities', loadComponent: () => import('./features/city/cities.component').then(m => m.CitiesComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'signup', loadComponent: () => import('./features/auth/signup.component').then(m => m.SignupComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'saved', loadComponent: () => import('./features/member/saved.component').then(m => m.SavedComponent) },
  { path: 'account', canActivate: [authGuard], loadComponent: () => import('./features/member/account.component').then(m => m.AccountComponent) },
  { path: 'about', loadComponent: () => import('./features/pages/about.component').then(m => m.AboutComponent) },
  { path: 'privacy', data: { kind: 'privacy' }, loadComponent: () => import('./features/pages/legal.component').then(m => m.LegalComponent) },
  { path: 'terms', data: { kind: 'terms' }, loadComponent: () => import('./features/pages/legal.component').then(m => m.LegalComponent) },
  { path: '**', loadComponent: () => import('./features/pages/not-found.component').then(m => m.NotFoundComponent) },
];
