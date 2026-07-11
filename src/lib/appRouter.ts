export type AppPage =
  | 'home'
  | 'tools'
  | 'tool'
  | 'pricing'
  | 'whats-new'
  | 'about'
  | 'contact'
  | 'login'
  | 'signup'
  | 'payment'
  | 'dashboard'
  | 'profile'
  | 'settings'
  | 'forgot-password'
  | 'reset-password'
  | 'auth-callback'
  | 'terms'
  | 'policy'
  | 'cookies'
  | 'blog'
  | 'coming-soon'
  | 'not-found';

export type RouteState = {
  page: AppPage;
  toolSlug?: string;
  pathname: string;
  search: string;
};

const PAGE_TO_PATH: Record<Exclude<AppPage, 'tool' | 'not-found'>, string> = {
  home: '/',
  tools: '/tools',
  pricing: '/pricing',
  'whats-new': '/whats-new',
  about: '/about',
  contact: '/contact',
  login: '/login',
  signup: '/signup',
  payment: '/checkout/pro',
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  'auth-callback': '/auth/callback',
  terms: '/terms',
  policy: '/policy',
  cookies: '/cookies',
  blog: '/blog',
  'coming-soon': '/coming-soon',
};

export function getPathForPage(page: AppPage, toolSlug?: string) {
  if (page === 'tool') {
    return toolSlug ? `/tools/${encodeURIComponent(toolSlug)}` : '/tools/json-formatter';
  }
  if (page === 'not-found') {
    return '/404';
  }
  return PAGE_TO_PATH[page] || '/';
}

export function parseRoute(pathname: string, search = ''): RouteState {
  const normalizedPath = pathname.replace(/\/+$|^\s+|\s+$/g, '').toLowerCase() || '/';

  if (normalizedPath === '/' || normalizedPath === '') {
    return { page: 'home', pathname, search };
  }

  if (normalizedPath.startsWith('/tools/')) {
    const toolSlug = decodeURIComponent(pathname.split('/').filter(Boolean)[1] || 'json-formatter');
    return { page: 'tool', toolSlug, pathname, search };
  }

  if (normalizedPath === '/tools') return { page: 'tools', pathname, search };
  if (normalizedPath === '/pricing') return { page: 'pricing', pathname, search };
  if (normalizedPath === '/whats-new') return { page: 'whats-new', pathname, search };
  if (normalizedPath === '/about') return { page: 'about', pathname, search };
  if (normalizedPath === '/contact') return { page: 'contact', pathname, search };
  if (normalizedPath === '/login') return { page: 'login', pathname, search };
  if (normalizedPath === '/signup') return { page: 'signup', pathname, search };
  if (normalizedPath === '/checkout/pro' || normalizedPath === '/payment' || normalizedPath === '/upgrade') return { page: 'payment', pathname, search };
  
  if (normalizedPath === '/dashboard' || normalizedPath.startsWith('/dashboard/')) {
    if (normalizedPath === '/dashboard/billing') {
      return { page: 'settings', pathname: '/settings', search: '?tab=billing' };
    }
    if (normalizedPath === '/dashboard/favorites') {
      return { page: 'profile', pathname: '/profile', search: '#favorites' };
    }
    if (normalizedPath === '/dashboard/history') {
      return { page: 'profile', pathname: '/profile', search: '#history' };
    }
    return { page: 'profile', pathname: '/profile', search };
  }
  
  if (normalizedPath === '/profile') return { page: 'profile', pathname, search };
  if (normalizedPath === '/settings') return { page: 'settings', pathname, search };
  if (normalizedPath === '/forgot-password') return { page: 'forgot-password', pathname, search };
  if (normalizedPath === '/reset-password') return { page: 'reset-password', pathname, search };
  if (normalizedPath === '/auth/callback') return { page: 'auth-callback', pathname, search };
  if (normalizedPath === '/terms') return { page: 'terms', pathname, search };
  if (normalizedPath === '/policy') return { page: 'policy', pathname, search };
  if (normalizedPath === '/cookies') return { page: 'cookies', pathname, search };
  if (normalizedPath === '/blog') return { page: 'whats-new', pathname: '/whats-new', search };
  if (normalizedPath === '/coming-soon') return { page: 'coming-soon', pathname, search };

  return { page: 'not-found', pathname, search };
}

export function getRedirectTarget(search: string) {
  const params = new URLSearchParams(search);
  return params.get('redirect') || '/profile';
}
