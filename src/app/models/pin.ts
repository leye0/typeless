import { Guid } from 'guid-typescript';
import { PinType } from './pin-type';

export class Pin {
  id: string;
  name = '';
  dest: Pin | undefined;
  boxId: string;
  type = PinType.None;

  lines: any[] = [];X
  get line(): any {
    return this.lines[0];
  }
  set line(line: any) {
    for (const l of this.lines) {
      try { l.remove(); } catch { }
    }
    this.lines = [];
    this.lines.push(line);
  }

  lineTemps: any[] = [];
  get lineTemp(): any {
    return this.lineTemps[0];
  }
  set lineTemp(line: any) {
    this.clearLineTemps();
    this.lineTemps.push(line);
  }

  lineMoves: any[] = [];
  get lineMove(): any {
    return this.lineMoves[0];
  }
  set lineMove(line: any) {
    this.clearLineMoves();
    this.lineMoves.push(line);
  }

  clearLines(): void {
    this.clearLineTemps();
    this.clearLineMoves();
    if (this.dest) {
      this.dest.clearLines();
    }
  }

  private clearLineTemps(): void {
    for (const l of this.lineTemps) {
      try { l.remove(); } catch { }
    }
    this.lineTemps = [];
  }

  private clearLineMoves(): void {
    for (const l of this.lineMoves) {
      try { l.remove(); } catch { }
    }
    this.lineMoves = [];
  }

  constructor(name: string, type: PinType) {
    this.id = Guid.create().toString();
    this.name = name;
    this.type = type;
  }
}
