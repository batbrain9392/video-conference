import { Inject, Injectable } from '@angular/core';
// import { MEDIA_DEVICES } from '@video-conference/ng-web-apis-extended';
// import { PermissionsService } from '@ng-web-apis/permissions';
// import { combineLatest, from, of } from 'rxjs';
// import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
// import { WebRTCService } from '../web-rtc/web-rtc.service';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  // private readonly isCameraNotDenied$ = this.getIsCameraNotDenied();
  // private readonly isMicrophoneNotDenied$ = this.getIsMicrophoneNotDenied();
  // readonly isMediaNotDenied$ = this.getIsMediaNotDenied();
  // readonly localStream$ = this.getLocalStream();
  // constructor(
  //   private readonly permissions: PermissionsService,
  //   @Inject(MEDIA_DEVICES) private readonly mediaDevices: MediaDevices,
  //   private readonly webRTC: WebRTCService
  // ) {}
  // private getIsCameraNotDenied() {
  //   return this.permissions
  //     .state('camera')
  //     .pipe(map((state) => state !== 'denied'));
  // }
  // private getIsMicrophoneNotDenied() {
  //   return this.permissions
  //     .state('microphone')
  //     .pipe(map((state) => state !== 'denied'));
  // }
  // private getIsMediaNotDenied() {
  //   return combineLatest([
  //     this.isCameraNotDenied$,
  //     this.isMicrophoneNotDenied$,
  //   ]).pipe(
  //     map((states) => !states.includes(false)),
  //     shareReplay(1)
  //   );
  // }
  // private getLocalStream() {
  //   return this.isMediaNotDenied$.pipe(
  //     switchMap((isCameraNotDenied) =>
  //       isCameraNotDenied
  //         ? from(this.mediaDevices.getUserMedia({ video: true, audio: true }))
  //         : of(null)
  //     ),
  //     tap((stream) => this.webRTC.addStream(stream))
  //   );
  // }
}
