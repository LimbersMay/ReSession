import { Component } from '@angular/core';
import { PopupMockup } from './mockup/popup-mockup';

@Component({
  selector: 'app-root',
  imports: [PopupMockup],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {}
