import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'uc-github-corner',
  templateUrl: './github-corner.component.html',
  styleUrls: ['./github-corner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GithubCornerComponent {
  @Input() url = 'https://github.com/batbrain9392';
  @Input() fill = '#24292e';
  @Input() color = '#fff';
}
