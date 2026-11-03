import type { TableId } from '../i18n/types';
import type { TableDefinition, WallSegment } from './types';

/**
 * Shared outer playfield walls (x in [24..486], y in [18..476]),
 * plunger launch lane (x in [452..484]), top arch curve, and inlanes/slingshots.
 */
function createBasePlayfieldWalls(): WallSegment[] {
  return [
    // Left outer boundary
    { x1: 28, y1: 110, x2: 24, y2: 350, restitution: 0.55 },
    // Top-left arch
    { x1: 28, y1: 110, x2: 75, y2: 45, restitution: 0.55 },
    { x1: 75, y1: 45, x2: 175, y2: 22, restitution: 0.55 },
    { x1: 175, y1: 22, x2: 335, y2: 22, restitution: 0.55 },
    // Top-right arch over the plunger lane
    { x1: 335, y1: 22, x2: 425, y2: 24, restitution: 0.55 },
    { x1: 425, y1: 24, x2: 465, y2: 36, restitution: 0.55 },
    { x1: 465, y1: 36, x2: 482, y2: 65, restitution: 0.55 },

    // Plunger outer right wall
    { x1: 482, y1: 65, x2: 482, y2: 465, restitution: 0.45 },
    // Plunger floor
    { x1: 452, y1: 465, x2: 482, y2: 465, restitution: 0.3 },
    // Plunger inner divider wall (separating playfield from launch lane)
    { x1: 452, y1: 145, x2: 452, y2: 465, restitution: 0.55 },

    // Left inlane / funnel toward left flipper
    { x1: 24, y1: 350, x2: 148, y2: 418, restitution: 0.55 },
    // Right inlane / funnel toward right flipper
    { x1: 452, y1: 350, x2: 326, y2: 418, restitution: 0.55 },

    // Left slingshot kicker triangle
    { x1: 82, y1: 305, x2: 145, y2: 368, restitution: 1.28 },
    { x1: 82, y1: 305, x2: 82, y2: 368, restitution: 0.65 },
    { x1: 82, y1: 368, x2: 145, y2: 368, restitution: 0.65 },

    // Right slingshot kicker triangle
    { x1: 392, y1: 305, x2: 329, y2: 368, restitution: 1.28 },
    { x1: 392, y1: 305, x2: 392, y2: 368, restitution: 0.65 },
    { x1: 329, y1: 368, x2: 392, y2: 368, restitution: 0.65 },
  ];
}

export const TABLES: Record<TableId, TableDefinition> = {
  outpost: {
    id: 'outpost',
    paletteAsset: '/assets/OUTPOST.PAL',
    bitmapAsset: '/assets/OUTPOSTJ.BMP',
    flipperSpriteAsset: '/assets/OUTPOST2.BMP',
    tblAsset: '/assets/OUTPOST.TBL',
    previewAsset: '/assets/PICKOP.BMP',
    accentColor: '#00f0ff',
    gravity: 395,
    launchX: 467,
    launchY: 438,
    walls: [
      ...createBasePlayfieldWalls(),
      // Upper outpost deflector guide
      { x1: 120, y1: 95, x2: 195, y2: 72, restitution: 0.65 },
      { x1: 295, y1: 72, x2: 375, y2: 98, restitution: 0.65 },
    ],
    flippers: [
      {
        id: 'left_main',
        side: 'left',
        pivotX: 152,
        pivotY: 422,
        length: 62,
        radius: 7,
        restAngleDeg: 26,
        activeAngleDeg: -30,
      },
      {
        id: 'right_main',
        side: 'right',
        pivotX: 322,
        pivotY: 422,
        length: 62,
        radius: 7,
        restAngleDeg: 154,
        activeAngleDeg: 210,
      },
      {
        id: 'left_upper',
        side: 'left',
        pivotX: 78,
        pivotY: 222,
        length: 46,
        radius: 6,
        restAngleDeg: 22,
        activeAngleDeg: -32,
      },
    ],
    bumpers: [
      {
        id: 'op_bumper_1',
        x: 205,
        y: 138,
        radius: 19,
        impulse: 310,
        points: 1500,
        color: '#00f0ff',
        sound: 'ZAP1.WAV',
      },
      {
        id: 'op_bumper_2',
        x: 278,
        y: 132,
        radius: 19,
        impulse: 310,
        points: 1500,
        color: '#ff9500',
        sound: 'ZAP2.WAV',
      },
      {
        id: 'op_bumper_3',
        x: 242,
        y: 194,
        radius: 21,
        impulse: 335,
        points: 2500,
        color: '#48ff7a',
        sound: 'ZAP3.WAV',
      },
    ],
    targets: [
      // Fuel Station bank
      { id: 'op_fuel_1', groupId: 'fuel', x: 96, y: 145, radius: 10, points: 3000, color: '#00f0ff', label: 'F1' },
      { id: 'op_fuel_2', groupId: 'fuel', x: 112, y: 122, radius: 10, points: 3000, color: '#00f0ff', label: 'F2' },
      { id: 'op_fuel_3', groupId: 'fuel', x: 132, y: 102, radius: 10, points: 3000, color: '#00f0ff', label: 'F3' },
      // Recon Drone bank
      { id: 'op_recon_1', groupId: 'recon', x: 356, y: 106, radius: 10, points: 3500, color: '#ffae00', label: 'R1' },
      { id: 'op_recon_2', groupId: 'recon', x: 378, y: 128, radius: 10, points: 3500, color: '#ffae00', label: 'R2' },
      { id: 'op_recon_3', groupId: 'recon', x: 396, y: 154, radius: 10, points: 3500, color: '#ffae00', label: 'R3' },
      // Warp Drive core targets
      { id: 'op_warp_1', groupId: 'warp', x: 185, y: 255, radius: 11, points: 5000, color: '#ff3870', label: 'W1' },
      { id: 'op_warp_2', groupId: 'warp', x: 295, y: 255, radius: 11, points: 5000, color: '#ff3870', label: 'W2' },
    ],
    ramps: [
      {
        id: 'op_orbital_ramp',
        entryX: 142,
        entryY: 168,
        entryRadius: 16,
        controlX: 238,
        controlY: 42,
        exitX: 395,
        exitY: 235,
        points: 15000,
        label: 'ORBIT RAMP',
      },
    ],
    sinkholes: [
      {
        id: 'op_docking_bay',
        x: 242,
        y: 86,
        radius: 14,
        points: 12500,
        ejectVx: -145,
        ejectVy: 245,
        label: 'DOCK',
      },
    ],
  },

  command_post: {
    id: 'command_post',
    paletteAsset: '/assets/CP.PAL',
    bitmapAsset: '/assets/CPJ.BMP',
    flipperSpriteAsset: '/assets/CP2.BMP',
    tblAsset: '/assets/CP.TBL',
    previewAsset: '/assets/PICKCP.BMP',
    accentColor: '#ffaa00',
    gravity: 405,
    launchX: 467,
    launchY: 438,
    walls: [
      ...createBasePlayfieldWalls(),
      // Command Post tactical center dividers
      { x1: 135, y1: 105, x2: 190, y2: 80, restitution: 0.7 },
      { x1: 290, y1: 80, x2: 355, y2: 105, restitution: 0.7 },
    ],
    flippers: [
      {
        id: 'left_main',
        side: 'left',
        pivotX: 152,
        pivotY: 422,
        length: 62,
        radius: 7,
        restAngleDeg: 26,
        activeAngleDeg: -30,
      },
      {
        id: 'right_main',
        side: 'right',
        pivotX: 322,
        pivotY: 422,
        length: 62,
        radius: 7,
        restAngleDeg: 154,
        activeAngleDeg: 210,
      },
      {
        id: 'right_upper',
        side: 'right',
        pivotX: 396,
        pivotY: 224,
        length: 46,
        radius: 6,
        restAngleDeg: 158,
        activeAngleDeg: 212,
      },
    ],
    bumpers: [
      {
        id: 'cp_turret_1',
        x: 192,
        y: 144,
        radius: 20,
        impulse: 325,
        points: 2000,
        color: '#ffaa00',
        sound: 'ELEC1.WAV',
      },
      {
        id: 'cp_turret_2',
        x: 288,
        y: 144,
        radius: 20,
        impulse: 325,
        points: 2000,
        color: '#ff3b30',
        sound: 'ELEC2.WAV',
      },
      {
        id: 'cp_turret_3',
        x: 240,
        y: 202,
        radius: 21,
        impulse: 345,
        points: 3000,
        color: '#00f0ff',
        sound: 'ZAP4.WAV',
      },
    ],
    targets: [
      // Laser Turret bank
      { id: 'cp_laser_1', groupId: 'turret', x: 92, y: 152, radius: 10, points: 4000, color: '#ffaa00', label: 'L1' },
      { id: 'cp_laser_2', groupId: 'turret', x: 112, y: 126, radius: 10, points: 4000, color: '#ffaa00', label: 'L2' },
      { id: 'cp_laser_3', groupId: 'turret', x: 134, y: 104, radius: 10, points: 4000, color: '#ffaa00', label: 'L3' },
      // Force Shield array
      { id: 'cp_shield_1', groupId: 'shield', x: 350, y: 104, radius: 10, points: 4500, color: '#00f0ff', label: 'S1' },
      { id: 'cp_shield_2', groupId: 'shield', x: 372, y: 128, radius: 10, points: 4500, color: '#00f0ff', label: 'S2' },
      { id: 'cp_shield_3', groupId: 'shield', x: 392, y: 154, radius: 10, points: 4500, color: '#00f0ff', label: 'S3' },
      // Command Link nodes
      { id: 'cp_cmd_1', groupId: 'nexus', x: 178, y: 262, radius: 11, points: 6000, color: '#48ff7a', label: 'C1' },
      { id: 'cp_cmd_2', groupId: 'nexus', x: 302, y: 262, radius: 11, points: 6000, color: '#48ff7a', label: 'C2' },
    ],
    ramps: [
      {
        id: 'cp_tactical_ramp',
        entryX: 336,
        entryY: 172,
        entryRadius: 16,
        controlX: 240,
        controlY: 40,
        exitX: 92,
        exitY: 238,
        points: 18000,
        label: 'COMMAND RAMP',
      },
    ],
    sinkholes: [
      {
        id: 'cp_bunker_lock',
        x: 240,
        y: 88,
        radius: 14,
        points: 16000,
        ejectVx: 155,
        ejectVy: 250,
        label: 'BUNKER',
      },
    ],
  },

  mine: {
    id: 'mine',
    paletteAsset: '/assets/MINE.PAL',
    bitmapAsset: '/assets/MINEJ.BMP',
    flipperSpriteAsset: '/assets/MINE2.BMP',
    tblAsset: '/assets/MINE.TBL',
    previewAsset: '/assets/PICKMINE.BMP',
    accentColor: '#ff453a',
    gravity: 415,
    launchX: 467,
    launchY: 438,
    walls: [
      ...createBasePlayfieldWalls(),
      // Deep Mine crystal cavern walls
      { x1: 122, y1: 102, x2: 186, y2: 76, restitution: 0.72 },
      { x1: 294, y1: 76, x2: 362, y2: 102, restitution: 0.72 },
    ],
    flippers: [
      {
        id: 'left_main',
        side: 'left',
        pivotX: 152,
        pivotY: 422,
        length: 62,
        radius: 7,
        restAngleDeg: 26,
        activeAngleDeg: -30,
      },
      {
        id: 'right_main',
        side: 'right',
        pivotX: 322,
        pivotY: 422,
        length: 62,
        radius: 7,
        restAngleDeg: 154,
        activeAngleDeg: 210,
      },
      {
        id: 'left_upper',
        side: 'left',
        pivotX: 82,
        pivotY: 218,
        length: 46,
        radius: 6,
        restAngleDeg: 20,
        activeAngleDeg: -34,
      },
    ],
    bumpers: [
      {
        id: 'mn_crystal_1',
        x: 196,
        y: 136,
        radius: 20,
        impulse: 340,
        points: 2500,
        color: '#ff453a',
        sound: 'CRYSTAL1.WAV',
      },
      {
        id: 'mn_crystal_2',
        x: 284,
        y: 136,
        radius: 20,
        impulse: 340,
        points: 2500,
        color: '#bf5af2',
        sound: 'EXPLO1.WAV',
      },
      {
        id: 'mn_crystal_3',
        x: 240,
        y: 196,
        radius: 22,
        impulse: 360,
        points: 4000,
        color: '#ffd60a',
        sound: 'EXPLO2.WAV',
      },
    ],
    targets: [
      // Plasma Drill targets
      { id: 'mn_drill_1', groupId: 'drill', x: 94, y: 148, radius: 10, points: 5000, color: '#ff453a', label: 'D1' },
      { id: 'mn_drill_2', groupId: 'drill', x: 114, y: 124, radius: 10, points: 5000, color: '#ff453a', label: 'D2' },
      { id: 'mn_drill_3', groupId: 'drill', x: 136, y: 102, radius: 10, points: 5000, color: '#ff453a', label: 'D3' },
      // Crystal Vein targets
      { id: 'mn_vein_1', groupId: 'crystal', x: 352, y: 104, radius: 10, points: 5500, color: '#bf5af2', label: 'V1' },
      { id: 'mn_vein_2', groupId: 'crystal', x: 374, y: 128, radius: 10, points: 5500, color: '#bf5af2', label: 'V2' },
      { id: 'mn_vein_3', groupId: 'crystal', x: 394, y: 154, radius: 10, points: 5500, color: '#bf5af2', label: 'V3' },
      // Reactor Overload targets
      { id: 'mn_core_1', groupId: 'reactor', x: 182, y: 258, radius: 11, points: 7500, color: '#ffd60a', label: 'M1' },
      { id: 'mn_core_2', groupId: 'reactor', x: 298, y: 258, radius: 11, points: 7500, color: '#ffd60a', label: 'M2' },
    ],
    ramps: [
      {
        id: 'mn_ore_chute',
        entryX: 145,
        entryY: 168,
        entryRadius: 16,
        controlX: 242,
        controlY: 38,
        exitX: 392,
        exitY: 232,
        points: 25000,
        label: 'MINE CHUTE',
      },
    ],
    sinkholes: [
      {
        id: 'mn_core_shaft',
        x: 240,
        y: 86,
        radius: 15,
        points: 20000,
        ejectVx: -160,
        ejectVy: 260,
        label: 'CORE',
      },
    ],
  },
};

export const TABLE_ORDER: TableId[] = ['outpost', 'command_post', 'mine'];
