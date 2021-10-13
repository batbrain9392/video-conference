import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'video-conference-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('me') videoMeRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('other') videoOtherRef?: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    console.log(this.videoMeRef?.nativeElement);
  }
}
