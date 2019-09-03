import { Component } from '@angular/core';
import { BoxService } from 'src/app/services/box.service';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent {
  constructor(public boxService: BoxService) {}
  addBox(): void {}
}
