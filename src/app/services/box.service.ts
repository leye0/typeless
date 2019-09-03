// NICE IDEA: Download NPM tarball from browser into memory?
// https://stackoverflow.com/questions/15035786/download-source-from-npm-without-installing-it
import { Injectable } from '@angular/core';
import { Box, SerializedBox } from '../models/box';
import { Pin } from '../models/pin';
import { BehaviorSubject, Subject } from 'rxjs';
import 'leader-line';
import { PinType } from '../models/pin-type';
import { debounceTime } from 'rxjs/operators';

declare let LeaderLine: any;

@Injectable({
  providedIn: 'root'
})
export class BoxService {

  boxes: Box[] = [];

  selectedPin: BehaviorSubject<Pin | undefined> = new BehaviorSubject<Pin | undefined>(undefined);

  hoveredPin: BehaviorSubject<Pin | undefined> = new BehaviorSubject<Pin | undefined>(undefined);

  resizeStartCoordinates: { x: number, y: number } | undefined;
  resizeStartSize: { width: number, height: number } | undefined;
  resizedBox: Box | undefined;

  lastZindex = 1;

  _boardElement!: HTMLElement;

  updateScroll$: Subject<Box> = new Subject<Box>();

  _mousedown = false;

  elements: {} = {};

  constructor() {
    // this.addFakeData();
    this.load();
    this.updateScroll$
      .pipe(debounceTime(25))
      .subscribe(box => this.updateScroll(box));
  }

  addFakeData(): void {
    const b1 = new Box('Func1');
    b1.inputs.push(new Pin('i1', PinType.Input));
    b1.outputs.push(new Pin('o1', PinType.Output));
    const b2 = new Box('func2');
    b2.inputs.push(new Pin('i1', PinType.Input));
    b2.outputs.push(new Pin('o1', PinType.Output));
    const b3 = new Box('func3');
    b3.inputs.push(new Pin('i1', PinType.Input));
    b3.outputs.push(new Pin('o1', PinType.Output));
    const b4 = new Box('func4');
    b4.inputs.push(new Pin('i1', PinType.Input));
    b4.outputs.push(new Pin('o1', PinType.Output));
    b1.applyStyle();
    b2.applyStyle();
    b3.applyStyle();
    b4.applyStyle();

    this.boxes.push(b1);
    this.boxes.push(b2);
    this.boxes.push(b3);
    this.boxes.push(b4);
    for (const b of this.boxes) {
      for (const p of [...b.inputs, ...b.outputs]) {
        p.boxId = b.id;
      }
    }
  }

  pinMousedown(pin: Pin): void {
    this._mousedown = true;
    pin.clearLines();
    this.selectedPin.next(pin);
  }

  pinMouseup(pin: Pin): void {
    this._mousedown = false;
    pin.clearLines();
    if (this.pinAreAttachable(this.selectedPin.value, pin)) {
      this.attachPins(this.selectedPin.value, pin);
      this.save();
    }
    this.selectedPin.next(undefined);
  }

  pinMouseover(pin: Pin): void {
    if (this.pinAreAttachable(this.selectedPin.value, pin)) {
      pin.clearLines();
      this.drawLine(this.selectedPin.value, pin, true);
      this.hoveredPin.next(pin);
    }
  }

  drawLine(pin1: Pin, pin2: Pin, isTemporaryLine: boolean = false): void {
    const e1 = LeaderLine.pointAnchor(this.findElement(`_attach-${pin1.id}`), {  x: 6, y: 6 });
    const e2 = LeaderLine.pointAnchor(this.findElement(`_attach-${pin2.id}`), {  x: 6, y: 6 });
    const line = new LeaderLine(e1, e2, isTemporaryLine ? { dash: { animation: true } } : {});

    line.color = '#00000077';
    line.size = 4;
    line.startPlug = 'disc';
    line.endPlug = 'disc';

    if (isTemporaryLine) {
      pin2.lineTemp = line;
    } else {
      pin1.line = pin2.line = line;
    }
  }

  // TODO: Add caching for elements
  drawLineMove(pin1: Pin, x: number, y: number): void {
    const e1 = LeaderLine.pointAnchor(this.findElement(`_attach-${pin1.id}`), {  x: 6, y: 6 });
    const cursorElement = this.findElement('cursor-element') as HTMLElement;
    cursorElement.style.left = this.px(x);
    cursorElement.style.top = this.px(y);
    const line = new LeaderLine(e1, cursorElement, { dash: { animation: true } });

    line.color = '#bbbbff';
    line.size = 4;
    line.startPlug = 'disc';
    line.endPlug = 'square';
    pin1.lineMove = line;
  }

  pinAreAttachable(pin1: Pin, pin2: Pin): boolean {
    return (pin1 && pin2 && (pin1 !== pin2))
      && (pin2.boxId !== pin1.boxId)
      && (pin1.type !== pin2.type);
  }

  pinMouseout(pin: Pin): void {
    pin.clearLines();
    if (this.hoveredPin) {
      if (this.hoveredPin.value === pin) {
        this.hoveredPin.next(undefined);
      }
    }
  }

  boxMouseUp(): void {
    if (this.hoveredPin.value) { this.hoveredPin.value.clearLines(); }
    if (this.selectedPin.value) { this.selectedPin.value.clearLines(); }
    this._mousedown = false;
    this.selectedPin.next(undefined);
    this.hoveredPin.next(undefined);
  }


  boxMouseDown(box: Box): void {
    box.style.zIndex = box.style.zIndex || 1;
    box.style.zIndex = this.lastZindex++;
    box.applyStyle();
  }

  attachPins(sourcePin: Pin, destinationPin: Pin): void {
    if (!sourcePin) { return; }
    sourcePin.clearLines();
    destinationPin.clearLines();
    this.drawLine(sourcePin, destinationPin);
    sourcePin.dest = destinationPin;
  }

  boxMoved(box: Box): void {
    box.inputs.concat(box.outputs).forEach(pin => {
      if (pin.line) {
        try {
          pin.line.position();
        } catch {
          pin.clearLines();
        }
      }
      if (pin.lineTemp) {
        try {
          pin.lineTemp.position();
        } catch {
          pin.clearLines();
        }
      }
    });
    this.updateGridSize(box);
  }

  resizeStarted(box: Box, $event: MouseEvent): void {
    const { screenX, screenY } = $event;
    const { width, height } = box.element.style;
    this.resizeStartCoordinates = { x: screenX, y: screenY };
    this.resizeStartSize = { width: this.nopx(width), height: this.nopx(height) };
    this.resizedBox = box;
  }

  resizingBox($event: MouseEvent, resizeEnd: boolean = false): void {
    if (this.resizedBox) {
      const { screenX, screenY } = $event;
      const addedWidth = screenX - this.resizeStartCoordinates.x;
      const addedHeight = screenY - this.resizeStartCoordinates.y;
      const { width, height } = this.resizedBox.style;
      const newWidth = this.px(this.nopx(width) + addedWidth);
      const newHeight = this.px(this.nopx(height) + addedHeight);
      if (!resizeEnd) {
        this.resizedBox.element.style.width = newWidth;
        this.resizedBox.element.style.height = newHeight;
      } else {
        this.resizedBox.style.width = newWidth;
        this.resizedBox.style.height = newHeight;
        this.resizedBox.applyStyle();
        this.resizeStartCoordinates = undefined;
        this.resizedBox = undefined;
      }
      this.updateGridSize(this.resizedBox);
      this.save();
    }
    // If linking pin:
    if (this._mousedown) {
      if (resizeEnd) {
        this.selectedPin.value.clearLines();
        this._mousedown = false;
      } else if (this.selectedPin.value && $event) {
        this.drawLineMove(this.selectedPin.value, $event.clientX, $event.clientY - 24); // TODO: 24px = .app-header height
      }
    }
  }

  updateGridSize(box: Box): void {
    const bottom = Math.max(...this.boxes.map(b => b.element.getBoundingClientRect().bottom));
    const right = Math.max(...this.boxes.map(b => b.element.getBoundingClientRect().right));
    const trailingElement = this.findElement('trailing-element') as HTMLElement;
    trailingElement.style.top = (bottom + 20) + 'px';
    trailingElement.style.left = (right +  20) + 'px';
    this.updateScroll$.next(box);
  }

  updateScroll(box: Box): void {
    // const boxRect: { left, width, top, height } = box.element.getBoundingClientRect();
    // const board = this._boardElement || (this._boardElement = this.findElement('.container') as HTMLElement);
    // const boardRect: { width, height } = board.getBoundingClientRect();
    // const rightEdgeOverflow = (boxRect.left + (boxRect.width / 2)) - boardRect.width;
    // const leftEdgeOverflow = boxRect.left;
    // const bottomEdgeOverflow = (boxRect.top + (boxRect.height / 2)) - boardRect.height;
    // const topEdgeOverflow = boxRect.top;
    // const xScroll = rightEdgeOverflow ? 1 : leftEdgeOverflow < 0 ? -1 : 0;
    // const yScroll = bottomEdgeOverflow ? 1 : topEdgeOverflow < 0 ? -1 : 0;
  }

  findElement = id => this.elements[id] || (this.elements[id] = document.getElementById(id));

  private nopx = (value: string) => Number(value.replace('px', ''));
  private px = (value: number) => `${value}px`;

  load(): void {
    const loadedBoxes = <SerializedBox[]>JSON.parse(localStorage.getItem('typeless'));

    for (const loadedBox of loadedBoxes) {
      const box = new Box(loadedBox.name);
      Object.assign(box, {
        code: loadedBox.code,
        name: loadedBox.name,
        id: loadedBox.id,
        style: loadedBox.style,
        inputs: loadedBox.inputs.map(i => {
          const pin = new Pin(i.name, i.type);
          Object.assign(pin, { boxId: i.boxId, id: i.id, name: i.name, type: i.type });
          return pin;
        }),
        outputs: loadedBox.outputs.map(i => {
          const pin = new Pin(i.name, i.type);
          Object.assign(pin, { boxId: i.boxId, id: i.id, name: i.name, type: i.type });
          return pin;
        }),
      });
      this.boxes.push(box);
      setTimeout(() => {
        box.applyStyle();
        box.element.style.transform = loadedBox.transform; // X-Y position
      }, 200);
    }

    for (const loadedBox of loadedBoxes) {
      const srcBox = this.boxes.find(b => b.id === loadedBox.id);
      const pins = srcBox.inputs.concat(srcBox.outputs);
      for (const attachedPin of loadedBox.attachedPins) {
        const srcPin = pins.find(p => p.id === attachedPin.sourcePinId);
        const destBox = this.boxes.find(b => b.id === attachedPin.destBoxId);
        const destPin = destBox.inputs.concat(destBox.outputs).find(p => p.id === attachedPin.destPinId);
        setTimeout(() => this.attachPins(srcPin, destPin), 200);
      }
    }
  }

  save(): void {
    const savedBoxes = this.boxes.map(b => Box.serialize(b));
    localStorage.setItem('typeless', JSON.stringify(savedBoxes));
  }
}
