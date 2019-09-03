import { Guid } from 'guid-typescript';
import { Pin } from './pin';
import { PinType } from './pin-type';

export class Box {
  get element(): HTMLElement {
    return this._element || (this._element = document.getElementById(`_${this.id.toString()}`) as HTMLElement);
  }

  constructor(name: string) {
    this.id = Guid.create().toString();
    this.name = name;
    this.style.width = '200px';
    this.style.height = '216px';
  }
  id: string;
  name = '';
  inputs: Pin[] = [];
  outputs: Pin[] = [];
  style: any = {};

  code = '';

  // Not sure if it should go there:
  resizeStartCoordinates: { x: number, y: number} = { x: 0, y: 0 };
  isResizing = false;

  _element!: HTMLElement;

  static serialize(box: Box): SerializedBox {

    const serializedBox = <SerializedBox>{
      id: box.id,
      code: box.code,
      name: box.name,
      style: box.style,
      transform: box.element.style.transform,
      inputs: [],
      outputs: [],
      attachedPins: []
    };

    for (const i of box.inputs) {
      serializedBox.inputs.push({boxId: i.boxId, id: i.id, name: i.name, type: i.type});
      if (i.dest) {
        serializedBox.attachedPins.push({
          sourceBoxId: i.boxId,
          sourcePinId: i.id,
          destBoxId: i.dest.boxId,
          destPinId: i.dest.id
        });
      }
    }

    for (const i of box.outputs) {
      serializedBox.outputs.push({boxId: i.boxId, id: i.id, name: i.name, type: i.type});
    }

    return serializedBox;
  }

  applyStyle(): void {
    if (!this.element) {
      return;
    }
    Object.assign(this.element.style, JSON.parse(JSON.stringify(this.style)));
  }

  resizeStarted($event: any): void {
    this.isResizing = true;
    $event.preventDefault();
    $event.stopPropagation();
  }
}

export interface AttachedPin {
  sourceBoxId: string;
  sourcePinId: string;
  destBoxId: string;
  destPinId: string;
}

export interface SerializedBox {
  id: string;
  name: string;
  code: string;
  style: {};
  transform: string;
  inputs: SerializedPin[];
  outputs: SerializedPin[];
  attachedPins: AttachedPin[];
}

export interface SerializedPin {
  id: string;
  name: string;
  boxId: string;
  type: PinType;
}
