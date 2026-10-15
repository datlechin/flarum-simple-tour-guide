import app from 'flarum/forum/app';

import routeMatches from '../../common/utils/routeMatches';

export type RouteAccess = 'here' | 'moved' | 'param' | 'unknown';

export function onRoute(route: string | null): boolean {
  return routeMatches(route, app.current.get('routeName'));
}

export function goToRoute(route: string | null): RouteAccess {
  if (route === null || onRoute(route)) return 'here';

  const definition = app.routes[route];

  if (!definition) return 'unknown';
  if (definition.path.includes(':')) return 'param';

  m.route.set(app.route(route));

  return 'moved';
}
