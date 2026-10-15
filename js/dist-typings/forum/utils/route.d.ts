export type RouteAccess = 'here' | 'moved' | 'param' | 'unknown';
export declare function onRoute(route: string | null): boolean;
export declare function goToRoute(route: string | null): RouteAccess;
