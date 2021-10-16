import { inject, InjectionToken } from '@angular/core';
import { NAVIGATOR } from '@ng-web-apis/common';

export const MEDIA_DEVICES = new InjectionToken<MediaDevices | null>(
  'An abstraction over window.navigator.mediaDevices object',
  {
    providedIn: 'root',
    factory: () => inject(NAVIGATOR).mediaDevices || null,
  }
);
