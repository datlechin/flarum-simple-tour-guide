import Model from 'flarum/common/Model';
import type TourStep from './TourStep';
/**
 * A tour, as the admin area edits it. The forum reads a narrower payload of
 * its own; see `forum/loadTours`.
 */
export default class Tour extends Model {
    key(): string;
    title(): string;
    isEnabled(): boolean;
    /** 'auto' starts itself, 'manual' waits to be launched by the member. */
    startMode(): "auto" | "manual";
    /** A Flarum route name, or null to run wherever the member is. */
    route(): string | null;
    devices(): "any" | "desktop" | "mobile";
    /** Group ids that may see it. Null or empty means everybody. */
    groupIds(): number[] | null;
    maxAccountAgeDays(): number | null;
    position(): number;
    stepCount(): number;
    steps(): false | (TourStep | undefined)[];
}
