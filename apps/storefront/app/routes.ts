/**
 * React Router v7 Routes Configuration
 * Defines all routes for the application
 */

import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('register', 'routes/register.tsx'),
  route('profile', 'routes/profile.tsx'),
  route('dashboard', 'routes/dashboard.tsx'),
  route('orders', 'routes/orders.tsx'),
  route('orders/new', 'routes/orders.new.tsx'),
  route('orders/:id', 'routes/orders.$id.tsx'),
  route('payments', 'routes/payments.tsx'),
  route('payments/:id', 'routes/payments.$id.tsx'),
] satisfies RouteConfig;
