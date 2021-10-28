import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubCornerComponent } from './github-corner/github-corner.component';

@NgModule({
  imports: [CommonModule],
  declarations: [GithubCornerComponent],
  exports: [GithubCornerComponent],
})
export class UtilComponentsModule {}
