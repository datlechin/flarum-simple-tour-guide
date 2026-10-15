import 'flarum/common/models/User';

declare module 'flarum/common/models/User' {
  export default interface User {
    canResetTourGuide: () => boolean;
  }
}

declare global {
  // Core uses CloseWatcher too; this TypeScript's DOM library predates it.
  class CloseWatcher {
    onclose: ((event: Event) => void) | null;
    destroy(): void;
  }
}
