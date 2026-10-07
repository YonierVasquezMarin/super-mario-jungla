import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'play',
    loadComponent: () => import('./pages/play/play').then((module) => module.Play),
  },
  {
    path: 'credits',
    loadComponent: () => import('./pages/credits/credits').then((module) => module.Credits),
  },
  { path: '**', redirectTo: '' },
];
