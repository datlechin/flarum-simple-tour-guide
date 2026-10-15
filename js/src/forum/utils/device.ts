import app from 'flarum/forum/app';

import type { Devices } from '../../common/types';

export function isPhone(): boolean {
  return app.screen() === 'phone';
}

export function matchesDevice(devices: Devices): boolean {
  return devices === 'any' || devices === (isPhone() ? 'mobile' : 'desktop');
}
