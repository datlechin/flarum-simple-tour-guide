import 'flarum/common/models/User';

declare module 'flarum/common/models/User' {
  export default interface User {
    canResetTourGuide: () => boolean;

    /**
     * How many tours this member has been through, or `undefined` when the
     * actor is not allowed to know.
     */
    tourGuideCompletionCount: () => number | undefined;
  }
}
