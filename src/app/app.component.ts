import { Component } from '@angular/core';
import { BoxService } from './services/box.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public boxService: BoxService) {}
}
