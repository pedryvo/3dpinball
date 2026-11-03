import type { TableId } from '../i18n/types';

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  restitution?: number;
  oneWay?: boolean;
}

export interface FlipperDefinition {
  id: string;
  side: 'left' | 'right';
  pivotX: number;
  pivotY: number;
  length: number;
  radius: number;
  restAngleDeg: number;
  activeAngleDeg: number;
}

export interface BumperDefinition {
  id: string;
  x: number;
  y: number;
  radius: number;
  impulse: number;
  points: number;
  color: string;
  sound: string;
}

export interface TargetDefinition {
  id: string;
  groupId: string;
  x: number;
  y: number;
  radius: number;
  points: number;
  color: string;
  label: string;
}

export interface RampSplineDefinition {
  id: string;
  entryX: number;
  entryY: number;
  entryRadius: number;
  controlX: number;
  controlY: number;
  exitX: number;
  exitY: number;
  points: number;
  label: string;
}

export interface SinkholeDefinition {
  id: string;
  x: number;
  y: number;
  radius: number;
  points: number;
  ejectVx: number;
  ejectVy: number;
  label: string;
}

export interface TableDefinition {
  id: TableId;
  paletteAsset: string;
  bitmapAsset: string;
  flipperSpriteAsset: string;
  tblAsset: string;
  previewAsset: string;
  accentColor: string;
  gravity: number;
  launchX: number;
  launchY: number;
  walls: WallSegment[];
  flippers: FlipperDefinition[];
  bumpers: BumperDefinition[];
  targets: TargetDefinition[];
  ramps: RampSplineDefinition[];
  sinkholes: SinkholeDefinition[];
}
