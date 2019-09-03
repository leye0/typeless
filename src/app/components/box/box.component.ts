import { Component, Input, AfterViewInit } from '@angular/core';
import { Box } from 'src/app/models/box';
import { BoxService } from 'src/app/services/box.service';
declare let ace: any;
@Component({
  selector: 'app-box',
  templateUrl: './box.component.html',
  styleUrls: ['./box.component.scss']
})
export class BoxComponent implements AfterViewInit {
  @Input() box: Box;

  constructor(public boxService: BoxService) {}

  ngAfterViewInit(): void {
    this.box.applyStyle();
  }

  boxMoved(): void {
    this.boxService.save();
  }

  edit(): void {
    const editor = ace.edit(`editor-${this.box.id}`);
    editor.setTheme('ace/theme/monokai');
    editor.getSession().setMode('ace/mode/javascript');
    const editorElement = this.box.element.querySelector('.editor') as HTMLElement;
    editorElement.classList.toggle('visible');
    editorElement.focus();
  }

  editTitle(r: HTMLElement): void {
      r.focus();
      r.scrollIntoView();
      r.click();
  }
}
