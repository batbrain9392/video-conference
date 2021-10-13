import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import { PermissionsService } from '@ng-web-apis/permissions';
import { MEDIA_DEVICES } from '@ng-web-apis-extended';

@Component({
  selector: 'video-conference-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('me') videoMeRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('other') videoOtherRef?: ElementRef<HTMLVideoElement>;

  constructor(
    private readonly permissions: PermissionsService,
    @Inject(MEDIA_DEVICES) private readonly mediaDevices: MediaDevices
  ) // private readonly elementRef: ElementRef<HTMLElement>,
  {}

  ngAfterViewInit(): void {
    this.permissions.state('camera').subscribe(console.log);
    this.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(console.log);
    console.log(this.videoMeRef?.nativeElement);
  }
}
