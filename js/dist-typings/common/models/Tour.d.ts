import Model from 'flarum/common/Model';
import type Group from 'flarum/common/models/Group';
import type TourCompletion from './TourCompletion';
import type TourStep from './TourStep';
import type { Devices, StartMode } from '../types';
export default class Tour extends Model {
    key(): string;
    title(): string;
    isEnabled(): boolean;
    startMode(): StartMode;
    route(): string | null;
    devices(): Devices;
    maxAccountAgeDays(): number | null;
    position(): number;
    groups(): false | (Group | undefined)[];
    steps(): TourStep[];
    enabledSteps(): false | (TourStep | undefined)[];
    completion(): false | TourCompletion;
}
