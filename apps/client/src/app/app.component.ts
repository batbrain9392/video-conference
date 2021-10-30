import { Component } from '@angular/core';
import { MediaService, WebRTCService } from '@video-conference/services';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'video-conference-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly localStream$ = this.media.localStream$;
  readonly remoteStream$ = this.webRTC.remoteStream$;
  callId = '';
  isCreateCallDisabled = false;
  isAnswerDisabled = false;

  constructor(
    private readonly media: MediaService,
    private readonly webRTC: WebRTCService
  ) {}

  createCall(): void {
    this.disableButtons();
    this.webRTC
      .createCall()
      .pipe(tap((callId) => (this.callId = callId)))
      .subscribe();
  }

  joinCall(): void {
    this.disableButtons();
    this.webRTC.joinCall(this.callId).subscribe();
  }

  private disableButtons(): void {
    this.isCreateCallDisabled = true;
    this.isAnswerDisabled = true;
  }
}
