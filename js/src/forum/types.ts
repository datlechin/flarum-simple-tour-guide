export type Devices = 'any' | 'desktop' | 'mobile';

export type Placement = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export type StartMode = 'auto' | 'manual';

/**
 * A step as the forum receives it: already the reader's language, already
 * stripped of anything they are not meant to know.
 */
export interface TourStepData {
  id: number;
  title: string;
  description: string;
  target: string | null;
  placement: Placement;
  devices: Devices;
  clicksTarget: boolean;
  advanceOnClick: boolean;
}

export interface TourData {
  id: number;
  key: string;
  title: string;
  startMode: StartMode;
  /** A Flarum route name, or null to run wherever the reader is. */
  route: string | null;
  devices: Devices;
  completed: boolean;
  /** True when an admin is looking at their own work; nothing is recorded. */
  preview: boolean;
  steps: TourStepData[];
}

export type TourOutcome = 'finished' | 'dismissed';
