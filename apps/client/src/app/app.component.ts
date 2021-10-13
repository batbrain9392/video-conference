import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MediaService } from './lib/media/media.service';

@Component({
  selector: 'video-conference-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly isMediaNotDenied$ = this.media.isMediaNotDenied$;
  readonly myStream$ = this.media.myStream$;

  constructor(private readonly media: MediaService) {}

  log(...args: unknown[]): void {
    console.log(...args);
  }
}
