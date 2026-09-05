import * as Phaser from 'phaser';

export const WORLD_W = 2400;
export const WORLD_H = 1800;
export const VILLAGE_X = 1200;
export const VILLAGE_Y = 900;

// ── Difficulty Settings (plan §3.1) ─────────────────────────────────────────
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultySettings {
  label: string;
  timeLimit: number;   // seconds
  maxFocus: number;    // Focus charges
  decoys: number;      // mirage clues (0 / 1 / 3)
  miragePenalty: number; // time penalty seconds
  clarity: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultySettings> = {
  EASY:   { label: 'Easy',   timeLimit: 480, maxFocus: 5, decoys: 0, miragePenalty: 15, clarity: 'All signs point to true water' },
  MEDIUM: { label: 'Medium', timeLimit: 360, maxFocus: 3, decoys: 2, miragePenalty: 20, clarity: 'Some conflicting mirage signs' },
  HARD:   { label: 'Hard',   timeLimit: 300, maxFocus: 2, decoys: 3, miragePenalty: 25, clarity: 'Ambiguous signs, harsh penalties' },
};

export const MAX_TIME = DIFFICULTIES.EASY.timeLimit;

// Event names
export const EVT_PHASE_CHANGED = 'phase-changed';
export const EVT_SCOUT_TELEMETRY = 'scout-telemetry';
export const EVT_CLUE_INSPECTED = 'clue-inspected';
export const EVT_WATER_DISCOVERED = 'water-discovered';
export const EVT_FOCUS_ACTIVATED = 'focus-activated';
export const EVT_JOURNAL_TOGGLE = 'journal-toggle';
export const EVT_START_GAME = 'start-game';
export const EVT_RESET_EXPEDITION = 'reset-expedition';
export const EVT_TOGGLE_PAUSE = 'toggle-pause';
export const EVT_TOUCH_DIR = 'touch-dir';
export const EVT_TOUCH_OBSERVE = 'touch-observe';
export const EVT_TOUCH_FOCUS = 'touch-focus';
export const EVT_CHARACTER_POS = 'character-pos';
export const EVT_RESET_CHARACTER = 'reset-character';

export const EventBus = new Phaser.Events.EventEmitter();

export type GamePhase = 'BOOT' | 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'FINISHED' | 'GAMEOVER';

export type SignCategory = 'birds' | 'vegetation' | 'tracks' | 'mirage';

export interface ClueData {
  id: string;
  waterSourceId: string;
  title: string;
  description: string;
  signType: SignCategory;
  categoryLabel: string;
  isDecoy: boolean;
  pointsTo: string; // compass direction label, e.g. 'NW'
  x: number;
  y: number;
  discovered: boolean;
}

export interface WaterSourceData {
  id: string;
  name: string;
  locationName: string;
  description: string;
  x: number;
  y: number;
  cluesRequired: number;
  cluesFound: number;
  discovered: boolean;
}

export interface ScoutTelemetry {
  x: number;
  y: number;
  heading: number;
  hydration: number;
  timeRemaining: number;
  waterFound: number;
  totalWater: number;
  cluesFound: number;
  totalClues: number;
  nearbyClue: ClueData | null;
  nearHomeVillage: boolean;
  canWin: boolean;
  difficulty: Difficulty;
  focusRemaining: number;
  maxFocus: number;
  isFocusActive: boolean;
}

const CATEGORY_LABELS: Record<SignCategory, string> = {
  birds: 'Birds',
  vegetation: 'Vegetation',
  tracks: 'Animal Tracks',
  mirage: 'Mirage',
};

// True clue templates: 3 per water source, one per category.
const TRUE_CLUES: Omit<ClueData, 'discovered' | 'x' | 'y'>[] = [
  // Baobab Aquifer (NW)
  { id: 'clue_nw_birds', waterSourceId: 'baobab_aquifer', title: 'Weaver Flocks Circling NW', description: 'Golden weaver birds wheel in tight spirals above the north-west tree line — flocks always converge where moisture pools under the canopy.', signType: 'birds', categoryLabel: CATEGORY_LABELS.birds, isDecoy: false, pointsTo: 'NW' },
  { id: 'clue_nw_veg', waterSourceId: 'baobab_aquifer', title: 'Emerald Baobab Shoots', description: 'Vivid green shoots burst through cracked bark on the NW baobabs. Only deep root systems tapping an aquifer can flush such lush growth in a drought.', signType: 'vegetation', categoryLabel: CATEGORY_LABELS.vegetation, isDecoy: false, pointsTo: 'NW' },
  { id: 'clue_nw_tracks', waterSourceId: 'baobab_aquifer', title: 'Zebra Hoofprints to the Grove', description: 'A line of fresh zebra mud-hoofprints presses through the dust, all oriented north-west toward the ancient grove where herds drink at dusk.', signType: 'tracks', categoryLabel: CATEGORY_LABELS.tracks, isDecoy: false, pointsTo: 'NW' },
  // Crystal Spring (East)
  { id: 'clue_e_birds', waterSourceId: 'crystal_oasis', title: 'Dragonflies Skimming East', description: 'Azure dragonflies dart low in shimmering patterns toward the eastern granite ridge — they lay eggs only over standing water.', signType: 'birds', categoryLabel: CATEGORY_LABELS.birds, isDecoy: false, pointsTo: 'E' },
  { id: 'clue_e_veg', waterSourceId: 'crystal_oasis', title: 'Lush Moisture Grass Tufts', description: 'A band of deep-green grass tufts glows against the yellow scrub, densest on the eastern side where seepage keeps the soil cool.', signType: 'vegetation', categoryLabel: CATEGORY_LABELS.vegetation, isDecoy: false, pointsTo: 'E' },
  { id: 'clue_e_tracks', waterSourceId: 'crystal_oasis', title: 'Springbok Trail to the Basin', description: 'Narrow springbok prints step over one another in a steady trail pointing due east toward the shaded granite basin.', signType: 'tracks', categoryLabel: CATEGORY_LABELS.tracks, isDecoy: false, pointsTo: 'E' },
  // Riverbed Well (SW)
  { id: 'clue_sw_birds', waterSourceId: 'riverbed_well', title: 'Low-Diving Swallows SW', description: 'Swallows skim inches above the dry sand bed, snapping up humidity-loving insects that rise from the south-west bend.', signType: 'birds', categoryLabel: CATEGORY_LABELS.birds, isDecoy: false, pointsTo: 'SW' },
  { id: 'clue_sw_veg', waterSourceId: 'riverbed_well', title: 'Scarlet River Lilies', description: 'Rare scarlet lilies bloom vigorously in the cracked channel — their petals only open where water lies a hand-span below the clay.', signType: 'vegetation', categoryLabel: CATEGORY_LABELS.vegetation, isDecoy: false, pointsTo: 'SW' },
  { id: 'clue_sw_tracks', waterSourceId: 'riverbed_well', title: 'Gazelle Prints to the Bend', description: 'Delicate cloven gazelle tracks trail toward the south-west river bend, pausing where the animals scraped at damp sand.', signType: 'tracks', categoryLabel: CATEGORY_LABELS.tracks, isDecoy: false, pointsTo: 'SW' },
];

// Decoy mirage templates (Medium/Hard).
const DECOY_CLUES: Omit<ClueData, 'discovered' | 'x' | 'y'>[] = [
  { id: 'decoy_1', waterSourceId: 'decoy', title: 'Withered Acacia Tracks', description: 'A dry mirage trail — these tracks lead to an old withered acacia, not water. The prints circle back on themselves in the dust.', signType: 'mirage', categoryLabel: CATEGORY_LABELS.mirage, isDecoy: true, pointsTo: 'N' },
  { id: 'decoy_2', waterSourceId: 'decoy', title: 'Shimmering Heat Mirage', description: 'The glint ahead bends and wobbles with the heat. As you approach it evaporates — a false pool painted by the sun.', signType: 'mirage', categoryLabel: CATEGORY_LABELS.mirage, isDecoy: true, pointsTo: 'SE' },
  { id: 'decoy_3', waterSourceId: 'decoy', title: 'Scattered Dry Bones', description: 'A flock sign that led the herds astray: sun-bleached bones and cracked earth. No water ever gathered here.', signType: 'mirage', categoryLabel: CATEGORY_LABELS.mirage, isDecoy: true, pointsTo: 'NE' },
];

// Placement positions for clues (true) and decoys.
const TRUE_POSITIONS: Record<string, { x: number; y: number }> = {
  clue_nw_birds: { x: 520, y: 560 },
  clue_nw_veg: { x: 430, y: 430 },
  clue_nw_tracks: { x: 800, y: 650 },
  clue_e_birds: { x: 1840, y: 800 },
  clue_e_veg: { x: 1620, y: 850 },
  clue_e_tracks: { x: 1960, y: 760 },
  clue_sw_birds: { x: 950, y: 1250 },
  clue_sw_veg: { x: 620, y: 1490 },
  clue_sw_tracks: { x: 740, y: 1400 },
};

const DECOY_POSITIONS: { x: number; y: number }[] = [
  { x: 1450, y: 520 },
  { x: 380, y: 1150 },
  { x: 1700, y: 1350 },
];

export class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; E: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key; J: Phaser.Input.Keyboard.Key; TAB: Phaser.Input.Keyboard.Key; P: Phaser.Input.Keyboard.Key; ESC: Phaser.Input.Keyboard.Key; F: Phaser.Input.Keyboard.Key };

  private touchVelocity = { x: 0, y: 0 };
  private phase: GamePhase = 'MENU';
  private difficulty: Difficulty = 'EASY';
  private settings: DifficultySettings = DIFFICULTIES.EASY;
  private timeRemaining = MAX_TIME;
  private hydration = 100;

  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private clues: ClueData[] = [];
  private waterSources: WaterSourceData[] = [];

  private activeNearbyClue: ClueData | null = null;
  private nearHome = true;

  // Focus mechanic state (plan §3.2)
  private focusRemaining = 0;
  private focusActive = false;
  private focusUntil = 0; // this.time.now when focus ends

  // Visual containers & effects
  private clueMarkers: Map<string, Phaser.GameObjects.Container> = new Map();
  private focusHalos: Map<string, Phaser.GameObjects.Image> = new Map();
  private waterMarkers: Map<string, Phaser.GameObjects.Container> = new Map();
  private waterBursts: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private mistEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private focusRing?: Phaser.GameObjects.Graphics;
  private focusTint?: Phaser.GameObjects.Rectangle;
  private audioCtx?: AudioContext;

  // EventBus listener handlers (stored so they can be removed on SHUTDOWN)
  private busListeners: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

  constructor() {
    super('Game');
  }

  preload(): void {
    // All visuals are procedurally generated in createProceduralTextures() — no external assets needed.
  }

  create(): void {
    this.initAudio();
    this.createProceduralTextures();
    this.initWorldData(this.difficulty);

    // World physics bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.set(0, 0);

    // Build Savanna Environment (Ground, Landmarks, Huts, Rocks, Baobabs)
    this.buildSavannaTerrain();

    // Create Player
    this.createPlayer();

    // Create Clue & Water Locations
    this.buildCluesAndWaterSources();

    // Create Atmospheric Effects (Breeze mist, dust, wildlife)
    this.createAtmosphericEffects();

    // Setup Input Controls
    this.setupInputs();

    // Camera follow with deadzone
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    // Register EventBus Handlers
    this.setupEventBus();

    // Clean up EventBus listeners when the scene shuts down (prevents
    // double-firing after a React StrictMode remount / scene restart).
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeEventBusListeners());

    // Signal Ready
    EventBus.emit('current-scene-ready', this);
    EventBus.emit(EVT_PHASE_CHANGED, this.phase);
  }

  private initAudio(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch {
      // Audio fallback
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal = 0.1): void {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Ignore audio error
    }
  }

  private playChime(): void {
    this.playTone(523.25, 'sine', 0.2, 0.15); // C5
    this.time.delayedCall(100, () => this.playTone(659.25, 'sine', 0.2, 0.15)); // E5
    this.time.delayedCall(200, () => this.playTone(783.99, 'sine', 0.3, 0.2)); // G5
    this.time.delayedCall(300, () => this.playTone(1046.50, 'sine', 0.4, 0.25)); // C6
  }

  private playClueSound(): void {
    this.playTone(440, 'triangle', 0.15, 0.12);
    this.time.delayedCall(120, () => this.playTone(587.33, 'triangle', 0.25, 0.15));
  }

  private playStepSound(): void {
    this.playTone(180 + Math.random() * 40, 'sawtooth', 0.05, 0.02);
  }

  /** Ethereal harmonics sweep for Focus activation (plan §3.2). */
  private playFocusSound(): void {
    this.playTone(392, 'sine', 0.5, 0.08);
    this.playTone(587.33, 'sine', 0.7, 0.06);
    this.time.delayedCall(150, () => this.playTone(784, 'sine', 0.8, 0.07));
    this.time.delayedCall(350, () => this.playTone(1174.66, 'sine', 0.9, 0.05));
  }

  /** Low dissonant buzz for false mirage leads (plan §3.4). */
  private playMirageBuzz(): void {
    this.playTone(160, 'sawtooth', 0.4, 0.12);
    this.time.delayedCall(120, () => this.playTone(120, 'sawtooth', 0.5, 0.12));
  }

  /** Grand cascading water eruption arpeggio (plan §3.5). */
  private playWaterEruption(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => {
      this.time.delayedCall(i * 90, () => this.playTone(f, 'sine', 0.5, 0.18));
    });
    this.time.delayedCall(480, () => this.playTone(1568, 'triangle', 0.7, 0.14));
  }

  private createProceduralTextures(): void {
    // 1. Scout Sprite Texture (Fallback if spritesheet not loaded)
    if (!this.textures.exists('scout_avatar')) {
      const g = this.add.graphics();
      g.fillStyle(0xd97706, 1);
      g.fillCircle(24, 24, 18);
      g.fillStyle(0x78350f, 1);
      g.fillCircle(24, 16, 10);
      g.fillStyle(0x0284c7, 1);
      g.fillTriangle(24, 6, 28, 0, 22, 10);
      g.fillStyle(0x451a03, 1);
      g.fillRect(30, 22, 8, 10);
      g.generateTexture('scout_avatar', 48, 48);
      g.destroy();
    }

    // 2. Savanna Baobab Tree
    if (!this.textures.exists('baobab_tree')) {
      const g = this.add.graphics();
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(35, 60, 90, 100, 20);
      g.fillStyle(0x92400e, 0.8);
      g.fillRect(45, 75, 12, 70);
      g.fillRect(75, 80, 14, 65);
      g.fillRect(100, 70, 10, 75);
      g.fillStyle(0x15803d, 1);
      g.fillCircle(45, 45, 35);
      g.fillCircle(80, 30, 42);
      g.fillCircle(115, 45, 35);
      g.fillStyle(0x22c55e, 0.85);
      g.fillCircle(80, 40, 32);
      g.generateTexture('baobab_tree', 160, 170);
      g.destroy();
    }

    // 3. Acacia Tree
    if (!this.textures.exists('acacia_tree')) {
      const g = this.add.graphics();
      g.lineStyle(10, 0x543310, 1);
      g.beginPath();
      g.moveTo(50, 110);
      g.lineTo(55, 60);
      g.lineTo(30, 30);
      g.moveTo(55, 60);
      g.lineTo(80, 25);
      g.strokePath();
      g.fillStyle(0x4d7c0f, 1);
      g.fillEllipse(30, 25, 55, 18);
      g.fillEllipse(80, 20, 50, 16);
      g.fillEllipse(55, 15, 70, 20);
      g.fillStyle(0x65a30d, 0.8);
      g.fillEllipse(55, 13, 50, 14);
      g.generateTexture('acacia_tree', 120, 120);
      g.destroy();
    }

    // 4. Village Round Hut
    if (!this.textures.exists('village_hut')) {
      const g = this.add.graphics();
      g.fillStyle(0xa16207, 1);
      g.fillCircle(48, 55, 36);
      g.fillStyle(0xd97706, 1);
      g.fillTriangle(48, 4, 8, 55, 88, 55);
      g.fillStyle(0xb45309, 1);
      g.fillTriangle(48, 4, 25, 55, 71, 55);
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(40, 62, 16, 24, 4);
      g.generateTexture('village_hut', 96, 96);
      g.destroy();
    }

    // 5. Village Campfire / Beacon
    if (!this.textures.exists('village_fire')) {
      const g = this.add.graphics();
      g.fillStyle(0x52525b, 1);
      g.fillCircle(32, 32, 28);
      g.fillStyle(0x18181b, 1);
      g.fillCircle(32, 32, 20);
      g.fillStyle(0x78350f, 1);
      g.fillRect(18, 28, 28, 8);
      g.fillRect(28, 18, 8, 28);
      g.fillStyle(0xf97316, 1);
      g.fillCircle(32, 32, 12);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(32, 32, 6);
      g.generateTexture('village_fire', 64, 64);
      g.destroy();
    }

    // 6. Natural Granite Boulder
    if (!this.textures.exists('granite_rock')) {
      const g = this.add.graphics();
      g.fillStyle(0x64748b, 1);
      g.fillRoundedRect(6, 12, 60, 42, 16);
      g.fillStyle(0x94a3b8, 0.9);
      g.fillRoundedRect(14, 16, 36, 24, 10);
      g.generateTexture('granite_rock', 72, 60);
      g.destroy();
    }

    // 7. Water Spring Pool
    if (!this.textures.exists('water_pool')) {
      const g = this.add.graphics();
      g.fillStyle(0x15803d, 1);
      g.fillEllipse(80, 60, 150, 105);
      g.fillStyle(0x0284c7, 1);
      g.fillEllipse(80, 60, 125, 80);
      g.fillStyle(0x38bdf8, 0.85);
      g.fillEllipse(80, 60, 95, 55);
      g.fillStyle(0x166534, 1);
      g.fillCircle(60, 50, 10);
      g.fillCircle(105, 68, 12);
      g.fillStyle(0xf43f5e, 1);
      g.fillCircle(60, 50, 4);
      g.fillCircle(105, 68, 5);
      g.generateTexture('water_pool', 160, 120);
      g.destroy();
    }

    // 8. Sign / Clue Marker Aura
    if (!this.textures.exists('clue_glow')) {
      const g = this.add.graphics();
      g.fillStyle(0x38bdf8, 0.35);
      g.fillCircle(32, 32, 30);
      g.fillStyle(0x0284c7, 0.7);
      g.fillCircle(32, 32, 16);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(32, 32, 7);
      g.generateTexture('clue_glow', 64, 64);
      g.destroy();
    }

    // 9. Particle Dust / Breeze
    if (!this.textures.exists('dust_particle')) {
      const g = this.add.graphics();
      g.fillStyle(0xd97706, 0.6);
      g.fillCircle(4, 4, 4);
      g.generateTexture('dust_particle', 8, 8);
      g.destroy();
    }

    // 10. Particle Mist / Moisture
    if (!this.textures.exists('mist_particle')) {
      const g = this.add.graphics();
      g.fillStyle(0x38bdf8, 0.7);
      g.fillCircle(6, 6, 6);
      g.generateTexture('mist_particle', 12, 12);
      g.destroy();
    }

    // 11. Water droplet for discovery bursts
    if (!this.textures.exists('water_drop')) {
      const g = this.add.graphics();
      g.fillStyle(0x7dd3fc, 1);
      g.fillCircle(5, 5, 5);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(4, 3, 2);
      g.generateTexture('water_drop', 10, 10);
      g.destroy();
    }

    // 12. Focus highlight halo (golden/cyan ring)
    if (!this.textures.exists('focus_halo')) {
      const g = this.add.graphics();
      g.lineStyle(5, 0xfbbf24, 0.95);
      g.strokeCircle(48, 48, 40);
      g.lineStyle(2, 0x22d3ee, 0.9);
      g.strokeCircle(48, 48, 46);
      g.fillStyle(0xfbbf24, 0.12);
      g.fillCircle(48, 48, 40);
      g.generateTexture('focus_halo', 96, 96);
      g.destroy();
    }
  }

  private initWorldData(difficulty: Difficulty): void {
    this.settings = DIFFICULTIES[difficulty];

    // Water Sources Definitions
    this.waterSources = [
      {
        id: 'baobab_aquifer',
        name: 'Baobab Hollow Aquifer',
        locationName: 'North-West Ancient Grove',
        description: 'An immense hollow baobab retaining tons of crystal-clear underground aquifer runoff.',
        x: 420,
        y: 360,
        cluesRequired: 3,
        cluesFound: 0,
        discovered: false,
      },
      {
        id: 'crystal_oasis',
        name: 'Hidden Crystalline Spring Pool',
        locationName: 'Eastern Granite Ridge Oasis',
        description: 'A secluded bedrock spring bubbling up between shaded granite gorges.',
        x: 2020,
        y: 740,
        cluesRequired: 3,
        cluesFound: 0,
        discovered: false,
      },
      {
        id: 'riverbed_well',
        name: 'Deep Riverbed Sand Well',
        locationName: 'South-West Meandering Dry Bend',
        description: 'A subterranean sand reservoir beneath damp clay ready to be tapped by the village.',
        x: 580,
        y: 1520,
        cluesRequired: 3,
        cluesFound: 0,
        discovered: false,
      },
    ];

    // Build clue list: 9 true signs + difficulty-scaled decoy mirages.
    this.clues = TRUE_CLUES.map(t => ({
      ...t,
      discovered: false,
      x: TRUE_POSITIONS[t.id]?.x ?? 0,
      y: TRUE_POSITIONS[t.id]?.y ?? 0,
    }));

    for (let i = 0; i < this.settings.decoys; i++) {
      const d = DECOY_CLUES[i % DECOY_CLUES.length];
      const pos = DECOY_POSITIONS[i % DECOY_POSITIONS.length];
      this.clues.push({ ...d, id: `${d.id}_${difficulty}`, discovered: false, x: pos.x, y: pos.y });
    }
  }

  private buildSavannaTerrain(): void {
    const terrain = this.add.graphics();
    terrain.fillStyle(0xd4a373, 1);
    terrain.fillRect(0, 0, WORLD_W, WORLD_H);

    terrain.fillStyle(0xccd5ae, 0.4);
    terrain.fillCircle(500, 450, 450);
    terrain.fillStyle(0xe9edc9, 0.35);
    terrain.fillCircle(1950, 800, 400);

    terrain.fillStyle(0xbfa07a, 0.85);
    terrain.beginPath();
    terrain.moveTo(300, 1800);
    terrain.lineTo(450, 1650);
    terrain.lineTo(650, 1450);
    terrain.lineTo(850, 1350);
    terrain.lineTo(1100, 1300);
    terrain.lineTo(1120, 1350);
    terrain.lineTo(880, 1420);
    terrain.lineTo(680, 1530);
    terrain.lineTo(480, 1750);
    terrain.lineTo(340, 1800);
    terrain.closePath();
    terrain.fill();

    terrain.lineStyle(18, 0xc29363, 0.5);
    terrain.strokeCircle(VILLAGE_X, VILLAGE_Y, 140);
    terrain.lineBetween(VILLAGE_X, VILLAGE_Y, 450, 400);
    terrain.lineBetween(VILLAGE_X, VILLAGE_Y, 1950, 780);
    terrain.lineBetween(VILLAGE_X, VILLAGE_Y, 650, 1480);

    this.obstaclesGroup = this.physics.add.staticGroup();

    this.buildHomeVillage();
    this.spawnLandscapeFloraAndRocks();
  }

  private buildHomeVillage(): void {
    const fire = this.add.image(VILLAGE_X, VILLAGE_Y, 'village_fire');
    fire.setScale(1.2);

    const aura = this.add.graphics();
    aura.fillStyle(0xf97316, 0.2);
    aura.fillCircle(VILLAGE_X, VILLAGE_Y, 70);
    this.tweens.add({
      targets: aura,
      alpha: { from: 0.2, to: 0.5 },
      scale: { from: 0.95, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 1200,
    });

    const hutPositions = [
      { x: VILLAGE_X - 100, y: VILLAGE_Y - 70 },
      { x: VILLAGE_X + 110, y: VILLAGE_Y - 60 },
      { x: VILLAGE_X - 90, y: VILLAGE_Y + 80 },
      { x: VILLAGE_X + 95, y: VILLAGE_Y + 75 },
      { x: VILLAGE_X, y: VILLAGE_Y - 120 },
    ];

    hutPositions.forEach(pos => {
      const hut = this.obstaclesGroup.create(pos.x, pos.y, 'village_hut') as Phaser.Physics.Arcade.Sprite;
      hut.refreshBody();
    });

    const signText = this.add.text(VILLAGE_X, VILLAGE_Y + 36, 'HOME VILLAGE BEACON', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#fef08a',
      backgroundColor: '#78350f',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5);
    signText.setDepth(5);
  }

  private spawnLandscapeFloraAndRocks(): void {
    const nwBaobabs = [
      { x: 220, y: 160 },
      { x: 640, y: 180 },
      { x: 180, y: 540 },
      { x: 580, y: 560 },
      { x: 720, y: 360 },
    ];
    nwBaobabs.forEach(p => {
      const b = this.obstaclesGroup.create(p.x, p.y, 'baobab_tree') as Phaser.Physics.Arcade.Sprite;
      const body = b.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(50, 45);
      body.setOffset(55, 125);
      b.refreshBody();
    });

    const eastRocks = [
      { x: 1900, y: 640 },
      { x: 2120, y: 680 },
      { x: 1920, y: 880 },
      { x: 2100, y: 840 },
      { x: 1780, y: 720 },
      { x: 2160, y: 760 },
    ];
    eastRocks.forEach(p => {
      const r = this.obstaclesGroup.create(p.x, p.y, 'granite_rock') as Phaser.Physics.Arcade.Sprite;
      r.refreshBody();
    });

    const acacias = [
      { x: 850, y: 400 },
      { x: 1050, y: 320 },
      { x: 1450, y: 360 },
      { x: 1650, y: 450 },
      { x: 920, y: 920 },
      { x: 1480, y: 950 },
      { x: 1250, y: 1350 },
      { x: 1550, y: 1420 },
      { x: 400, y: 980 },
      { x: 320, y: 1300 },
      { x: 820, y: 1650 },
      { x: 1800, y: 1250 },
      { x: 2150, y: 1400 },
      { x: 2050, y: 350 },
    ];
    acacias.forEach(p => {
      const a = this.obstaclesGroup.create(p.x, p.y, 'acacia_tree') as Phaser.Physics.Arcade.Sprite;
      a.refreshBody();
    });
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(VILLAGE_X, VILLAGE_Y + 40, 'scout_avatar');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setSize(30, 30);
    this.player.setOffset(9, 12);

    this.physics.add.collider(this.player, this.obstaclesGroup);
  }

  private buildCluesAndWaterSources(): void {
    this.clues.forEach(clue => {
      const container = this.add.container(clue.x, clue.y);
      container.setDepth(4);

      const glow = this.add.image(0, 0, 'clue_glow');
      glow.setScale(0.8);

      const badge = this.add.text(0, -28, clue.isDecoy ? 'SIGN ?' : 'SIGN ?', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#0284c7',
        padding: { x: 5, y: 2 },
      }).setOrigin(0.5);

      container.add([glow, badge]);

      this.tweens.add({
        targets: container,
        y: clue.y - 8,
        yoyo: true,
        repeat: -1,
        duration: 1000 + Math.random() * 400,
        ease: 'Sine.easeInOut',
      });

      this.clueMarkers.set(clue.id, container);
    });

    this.waterSources.forEach(source => {
      const container = this.add.container(source.x, source.y);
      container.setDepth(3);

      const pool = this.add.image(0, 0, 'water_pool');
      pool.setScale(1.1);

      const label = this.add.text(0, 50, source.name, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#e0f2fe',
        backgroundColor: '#0369a1',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5);

      container.add([pool, label]);
      container.setAlpha(0.65);

      // Cascading fountain burst (plan §3.5) — explodes on discovery.
      const burst = this.add.particles(source.x, source.y - 20, 'water_drop', {
        speed: { min: 120, max: 320 },
        angle: { min: 240, max: 300 },
        gravityY: 520,
        lifespan: { min: 700, max: 1400 },
        scale: { start: 1.4, end: 0.3 },
        alpha: { start: 1, end: 0 },
        emitting: false,
      });
      burst.setDepth(12);
      this.waterBursts.set(source.id, burst);

      this.waterMarkers.set(source.id, container);
    });
  }

  private createAtmosphericEffects(): void {
    const dustParticles = this.add.particles(0, 0, 'dust_particle', {
      x: { min: 0, max: WORLD_W },
      y: { min: 0, max: WORLD_H },
      lifespan: 3500,
      speedX: { min: 30, max: 90 },
      speedY: { min: -15, max: 20 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.4, end: 0 },
      frequency: 150,
      quantity: 2,
    });
    dustParticles.setDepth(2);
    this.dustEmitter = dustParticles;

    const mistParticles = this.add.particles(0, 0, 'mist_particle', {
      x: { min: 1800, max: 2150 },
      y: { min: 650, max: 900 },
      lifespan: 2800,
      speedX: { min: -20, max: 20 },
      speedY: { min: -30, max: -10 },
      scale: { start: 1.2, end: 0.3 },
      alpha: { start: 0.5, end: 0 },
      frequency: 120,
    });
    mistParticles.setDepth(2);
    this.mistEmitter = mistParticles;
  }

  private setupInputs(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,J,TAB,P,ESC,F') as typeof this.wasdKeys;

      this.input.keyboard.on('keydown-E', () => this.tryInspectNearbyClue());
      this.input.keyboard.on('keydown-SPACE', () => this.tryInspectNearbyClue());

      // Focus key
      this.input.keyboard.on('keydown-F', () => this.activateFocus());

      this.input.keyboard.on('keydown-J', () => EventBus.emit(EVT_JOURNAL_TOGGLE, true));
      this.input.keyboard.on('keydown-TAB', (e: KeyboardEvent) => {
        e.preventDefault();
        EventBus.emit(EVT_JOURNAL_TOGGLE, true);
      });

      this.input.keyboard.on('keydown-P', () => this.togglePause());
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }

    // Gamepad: Button X / Y / L1 → Focus, Button A → Observe (plan §3.2)
    if (this.input.gamepad) {
      this.input.gamepad.on('down', (pad: Phaser.Input.Gamepad.Gamepad, index: number) => {
        if (!pad) return;
        if (index === 2 || index === 3 || index === 4) {
          this.activateFocus();
        } else if (index === 0) {
          this.tryInspectNearbyClue();
        }
      });
    }
  }

  private setupEventBus(): void {
    this.onBus(EVT_START_GAME, (data) => {
      const payload = (data ?? {}) as { difficulty?: Difficulty };
      this.resetExpedition(payload.difficulty);
      this.playChime();
    });

    this.onBus(EVT_RESET_EXPEDITION, (data) => {
      const payload = (data ?? {}) as { difficulty?: Difficulty };
      this.resetExpedition(payload.difficulty);
    });

    this.onBus(EVT_TOGGLE_PAUSE, () => {
      this.togglePause();
    });

    this.onBus(EVT_TOUCH_DIR, (data) => {
      this.touchVelocity = (data ?? { x: 0, y: 0 }) as { x: number; y: number };
    });

    this.onBus(EVT_TOUCH_OBSERVE, () => {
      this.tryInspectNearbyClue();
    });

    this.onBus(EVT_TOUCH_FOCUS, () => {
      this.activateFocus();
    });

    this.onBus(EVT_RESET_CHARACTER, () => {
      if (this.player) {
        this.player.setPosition(VILLAGE_X, VILLAGE_Y + 40);
        this.player.setVelocity(0, 0);
      }
    });
  }

  /** Register a tracked EventBus listener so it can be torn down on SHUTDOWN. */
  private onBus(event: string, handler: (...args: unknown[]) => void): void {
    EventBus.on(event, handler);
    this.busListeners.push({ event, handler });
  }

  /** Remove every EventBus listener this scene registered in create(). */
  private removeEventBusListeners(): void {
    for (const { event, handler } of this.busListeners) {
      EventBus.removeListener(event, handler);
    }
    this.busListeners = [];
  }

  public startGame(): void {
    this.phase = 'PLAYING';
    EventBus.emit(EVT_PHASE_CHANGED, this.phase);
    this.playChime();
  }

  public resetExpedition(difficulty?: Difficulty): void {
    if (difficulty && DIFFICULTIES[difficulty]) {
      this.difficulty = difficulty;
    }
    this.settings = DIFFICULTIES[this.difficulty];
    this.phase = 'PLAYING';
    this.timeRemaining = this.settings.timeLimit;
    this.hydration = 100;
    this.focusRemaining = this.settings.maxFocus;
    this.deactivateFocus(true);
    this.initWorldData(this.difficulty);

    this.activeNearbyClue = null;
    this.nearHome = false;
    this.touchVelocity = { x: 0, y: 0 };
    if (this.physics && this.physics.world.isPaused) {
      this.physics.world.resume();
    }

    // Rebuild clue markers for the new layout (decoys differ per difficulty).
    this.rebuildClueMarkers();
    this.rebuildWaterMarkers();

    if (this.player) {
      this.player.setPosition(VILLAGE_X, VILLAGE_Y + 40);
      this.player.setVelocity(0, 0);
    }

    EventBus.emit(EVT_PHASE_CHANGED, this.phase);
    this.emitTelemetry();
  }

  private rebuildClueMarkers(): void {
    this.clueMarkers.forEach((container) => container.destroy());
    this.clueMarkers.clear();
    this.focusHalos.forEach((halo) => halo.destroy());
    this.focusHalos.clear();

    this.clues.forEach(clue => {
      const container = this.add.container(clue.x, clue.y);
      container.setDepth(4);

      const glow = this.add.image(0, 0, 'clue_glow');
      glow.setScale(0.8);

      const badge = this.add.text(0, -28, 'SIGN ?', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#0284c7',
        padding: { x: 5, y: 2 },
      }).setOrigin(0.5);

      container.add([glow, badge]);

      this.tweens.add({
        targets: container,
        y: clue.y - 8,
        yoyo: true,
        repeat: -1,
        duration: 1000 + Math.random() * 400,
        ease: 'Sine.easeInOut',
      });

      this.clueMarkers.set(clue.id, container);
    });
  }

  private rebuildWaterMarkers(): void {
    this.waterBursts.forEach((b) => b.destroy());
    this.waterBursts.clear();
    this.waterMarkers.forEach((container) => container.destroy());
    this.waterMarkers.clear();

    this.waterSources.forEach(source => {
      const container = this.add.container(source.x, source.y);
      container.setDepth(3);

      const pool = this.add.image(0, 0, 'water_pool');
      pool.setScale(1.1);

      const label = this.add.text(0, 50, source.name, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#e0f2fe',
        backgroundColor: '#0369a1',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5);

      container.add([pool, label]);
      container.setAlpha(0.65);

      const burst = this.add.particles(source.x, source.y - 20, 'water_drop', {
        speed: { min: 120, max: 320 },
        angle: { min: 240, max: 300 },
        gravityY: 520,
        lifespan: { min: 700, max: 1400 },
        scale: { start: 1.4, end: 0.3 },
        alpha: { start: 1, end: 0 },
        emitting: false,
      });
      burst.setDepth(12);
      this.waterBursts.set(source.id, burst);

      this.waterMarkers.set(source.id, container);
    });
  }

  public togglePause(): void {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
      this.physics.world.pause();
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
      this.physics.world.resume();
    }
    EventBus.emit(EVT_PHASE_CHANGED, this.phase);
  }

  // ── Focus Mechanic (plan §3.2) ────────────────────────────────────────────

  public activateFocus(): void {
    if (this.phase !== 'PLAYING') return;
    if (this.focusActive || this.focusRemaining <= 0) {
      if (this.focusRemaining <= 0) this.playMirageBuzz();
      return;
    }
    this.focusRemaining -= 1;
    this.focusActive = true;
    this.focusUntil = this.time.now + 3500;

    this.playFocusSound();
    EventBus.emit(EVT_FOCUS_ACTIVATED, { remaining: this.focusRemaining });

    // Visual pulse ring around the scout
    if (!this.focusRing) {
      this.focusRing = this.add.graphics();
      this.focusRing.setDepth(11);
    }
    this.focusRing.setVisible(true);
    this.focusRing.clear();
    this.focusRing.lineStyle(4, 0x22d3ee, 0.9);
    this.focusRing.strokeCircle(0, 0, 30);
    const ringTween = this.tweens.add({
      targets: this.focusRing,
      scale: 10,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (this.focusRing) {
          this.focusRing.setVisible(false);
          this.focusRing.setScale(1);
          this.focusRing.setAlpha(1);
        }
      },
    });
    void ringTween;

    // Cool time-dilation tint overlay (screen-space)
    if (!this.focusTint) {
      this.focusTint = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0e7490, 0.18);
      this.focusTint.setOrigin(0, 0);
      this.focusTint.setScrollFactor(0);
      this.focusTint.setDepth(900);
    }
    this.focusTint.setVisible(true);
    this.focusTint.setSize(this.scale.width, this.scale.height);

    // Highlight halos on undiscovered clues within 500px
    this.clues.forEach(clue => {
      if (clue.discovered) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clue.x, clue.y);
      if (dist > 500) return;
      if (this.focusHalos.has(clue.id)) return;
      const halo = this.add.image(clue.x, clue.y, 'focus_halo');
      halo.setDepth(5);
      halo.setAlpha(0);
      this.focusHalos.set(clue.id, halo);
      this.tweens.add({ targets: halo, alpha: 1, scale: { from: 0.6, to: 1.15 }, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    this.emitTelemetry();
  }

  private deactivateFocus(silent = false): void {
    if (!this.focusActive && silent) {
      // still clear any lingering halos/tint on reset
      this.focusHalos.forEach((halo) => halo.destroy());
      this.focusHalos.clear();
      if (this.focusTint) this.focusTint.setVisible(false);
      return;
    }
    this.focusActive = false;
    this.focusHalos.forEach((halo) => halo.destroy());
    this.focusHalos.clear();
    if (this.focusTint) this.focusTint.setVisible(false);
    if (this.focusRing) this.focusRing.setVisible(false);
    if (!silent) this.emitTelemetry();
  }

  // ── Inspection & Decisions (plan §3.4) ────────────────────────────────────

  public tryInspectNearbyClue(): void {
    if (this.phase !== 'PLAYING') return;

    // 1. Inspect a nearby sign
    if (this.activeNearbyClue) {
      const clue = this.activeNearbyClue;
      if (!clue.discovered) {
        clue.discovered = true;

        if (clue.isDecoy) {
          // Decoy mirage: time penalty + red journal warning (plan §3.4)
          this.timeRemaining = Math.max(0, this.timeRemaining - this.settings.miragePenalty);
          this.playMirageBuzz();
        } else {
          this.playClueSound();
        }

        const marker = this.clueMarkers.get(clue.id);
        if (marker) {
          const badge = marker.getAt(1) as Phaser.GameObjects.Text;
          if (badge) {
            badge.setText(clue.isDecoy ? 'MIRAGE !' : 'CHECKED ✓');
            badge.setBackgroundColor(clue.isDecoy ? '#b91c1c' : '#16a34a');
          }
        }

        // Update corresponding Water Source
        const water = this.waterSources.find(w => w.id === clue.waterSourceId);
        if (water) {
          water.cluesFound = this.clues.filter(c => c.waterSourceId === water.id && c.discovered).length;
          if (water.cluesFound >= water.cluesRequired && !water.discovered) {
            this.discoverWaterSource(water);
          }
        }

        EventBus.emit(EVT_CLUE_INSPECTED, clue);
        this.emitTelemetry();
      }
    }

    // 2. Win: all water found and standing at the Home Village Beacon
    const allWaterFound = this.waterSources.every(w => w.discovered);
    if (allWaterFound && this.nearHome) {
      this.phase = 'FINISHED';
      this.playChime();
      EventBus.emit(EVT_PHASE_CHANGED, this.phase);
    }
  }

  /**
   * Verify a water source: burst FX, chime, hydration boost, HUD update.
   * Shared by both discovery triggers (all 3 signs decoded, or direct
   * approach within 110px).
   */
  private discoverWaterSource(water: WaterSourceData): void {
    if (water.discovered) return;
    water.discovered = true;
    water.cluesFound = Math.max(water.cluesFound, water.cluesRequired);

    // Grand reward: cascading fountain + melodic eruption (plan §3.5)
    this.playWaterEruption();
    const burst = this.waterBursts.get(water.id);
    if (burst) {
      burst.explode(60);
      this.time.delayedCall(350, () => burst.explode(40));
    }

    const wMarker = this.waterMarkers.get(water.id);
    if (wMarker) {
      wMarker.setAlpha(1.0);
      this.tweens.add({
        targets: wMarker,
        scale: { from: 1.0, to: 1.25 },
        yoyo: true,
        duration: 600,
      });
    }

    // Hydration boost
    this.hydration = Math.min(100, this.hydration + 15);

    const count = this.waterSources.filter(w => w.discovered).length;
    EventBus.emit(EVT_WATER_DISCOVERED, {
      sourceId: water.id,
      name: water.name,
      locationName: water.locationName,
      count,
      total: this.waterSources.length,
    });
    this.emitTelemetry();
  }

  override update(_time: number, delta: number): void {
    if (this.phase !== 'PLAYING') {
      if (this.player && this.player.body) {
        this.player.setVelocity(0, 0);
      }
      return;
    }

    const dt = delta / 1000;

    // Focus time-dilation: slow world clock while focus active (plan §3.2)
    const timeScale = this.focusActive ? 0.4 : 1.0;

    // End focus when duration elapses
    if (this.focusActive && this.time.now >= this.focusUntil) {
      this.deactivateFocus();
    }

    // Update timers & hydration
    this.timeRemaining = Math.max(0, this.timeRemaining - dt * timeScale);
    this.hydration = Math.max(0, this.hydration - dt * 0.18 * timeScale);

    if (this.timeRemaining <= 0 || this.hydration <= 0) {
      this.deactivateFocus(true);
      this.phase = 'GAMEOVER';
      this.playTone(220, 'sawtooth', 0.8, 0.2);
      EventBus.emit(EVT_PHASE_CHANGED, this.phase);
      return;
    }

    // Handle Movement (slowed during focus)
    this.handleMovement(timeScale);

    // Check proximity to Clues and Home Village
    this.checkProximities();

    // Keep focus ring anchored to scout
    if (this.focusRing && this.focusRing.visible && this.player) {
      this.focusRing.x = this.player.x;
      this.focusRing.y = this.player.y;
    }

    // Emit live telemetry for React HUD
    this.emitTelemetry();
  }

  private handleMovement(timeScale: number): void {
    if (!this.player || !this.player.body) return;

    let moveX = 0;
    let moveY = 0;

    // 1. Keyboard Input
    if (this.cursors && this.wasdKeys) {
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) moveX -= 1;
      if (this.cursors.right.isDown || this.wasdKeys.D.isDown) moveX += 1;
      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) moveY -= 1;
      if (this.cursors.down.isDown || this.wasdKeys.S.isDown) moveY += 1;
    }

    // 2. Gamepad input (plan §3.2 — left stick + button X/Y/L1 for focus)
    const pad = this.input.gamepad?.pad1;
    if (pad) {
      if (pad.left) moveX -= 1;
      if (pad.right) moveX += 1;
      if (pad.up) moveY -= 1;
      if (pad.down) moveY += 1;
      if (typeof pad.leftStick?.x === 'number' && Math.abs(pad.leftStick.x) > 0.3) moveX = pad.leftStick.x;
      if (typeof pad.leftStick?.y === 'number' && Math.abs(pad.leftStick.y) > 0.3) moveY = pad.leftStick.y;
    }

    // 3. Touch / Virtual D-Pad Input override/addition
    if (Math.abs(this.touchVelocity.x) > 0.05 || Math.abs(this.touchVelocity.y) > 0.05) {
      moveX = this.touchVelocity.x;
      moveY = this.touchVelocity.y;
    }

    const speed = 210 * timeScale;
    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      const vx = (moveX / len) * speed;
      const vy = (moveY / len) * speed;
      this.player.setVelocity(vx, vy);

      if (Math.random() < 0.04) {
        this.playStepSound();
      }
    } else {
      this.player.setVelocity(0, 0);
    }
  }

  private checkProximities(): void {
    if (!this.player) return;
    const px = this.player.x;
    const py = this.player.y;

    let closest: ClueData | null = null;
    let minD = 95;

    for (const clue of this.clues) {
      if (clue.discovered) continue;
      const dist = Phaser.Math.Distance.Between(px, py, clue.x, clue.y);
      if (dist < minD) {
        minD = dist;
        closest = clue;
      }
    }
    this.activeNearbyClue = closest;

    const homeDist = Phaser.Math.Distance.Between(px, py, VILLAGE_X, VILLAGE_Y);
    this.nearHome = homeDist < 130;

    // Direct discovery trigger: approaching a water source zone (< 110 px)
    for (const source of this.waterSources) {
      if (source.discovered) continue;
      const wDist = Phaser.Math.Distance.Between(px, py, source.x, source.y);
      if (wDist < 110) {
        this.discoverWaterSource(source);
      }
    }

    // Win: once every water source is verified, arriving at the beacon completes.
    const allWaterFound = this.waterSources.every(w => w.discovered);
    if (allWaterFound && this.nearHome && this.phase === 'PLAYING') {
      this.deactivateFocus(true);
      this.phase = 'FINISHED';
      this.playChime();
      EventBus.emit(EVT_PHASE_CHANGED, this.phase);
    }
  }

  private emitTelemetry(): void {
    if (!this.player) return;
    const px = this.player.x;
    const py = this.player.y;

    const allWaterFound = this.waterSources.every(w => w.discovered);
    const waterFoundCount = this.waterSources.filter(w => w.discovered).length;
    const cluesFoundCount = this.clues.filter(c => c.discovered && !c.isDecoy).length;

    let targetX = VILLAGE_X;
    let targetY = VILLAGE_Y;

    if (!allWaterFound) {
      const nextClue = this.clues.find(c => !c.discovered && !c.isDecoy);
      if (nextClue) {
        targetX = nextClue.x;
        targetY = nextClue.y;
      }
    }

    const angleRad = Phaser.Math.Angle.Between(px, py, targetX, targetY);
    const headingDeg = Phaser.Math.RadToDeg(angleRad);

    const telemetry: ScoutTelemetry = {
      x: Math.round(px),
      y: Math.round(py),
      heading: Math.round(headingDeg),
      hydration: Math.round(this.hydration),
      timeRemaining: Math.ceil(this.timeRemaining),
      waterFound: waterFoundCount,
      totalWater: this.waterSources.length,
      cluesFound: cluesFoundCount,
      totalClues: this.clues.filter(c => !c.isDecoy).length,
      nearbyClue: this.activeNearbyClue,
      nearHomeVillage: this.nearHome,
      canWin: allWaterFound && this.nearHome,
      difficulty: this.difficulty,
      focusRemaining: this.focusRemaining,
      maxFocus: this.settings.maxFocus,
      isFocusActive: this.focusActive,
    };

    EventBus.emit(EVT_SCOUT_TELEMETRY, telemetry);
    EventBus.emit(EVT_CHARACTER_POS, { x: px, y: py });
  }

  public getClues(): ClueData[] {
    return this.clues;
  }

  public getWaterSources(): WaterSourceData[] {
    return this.waterSources;
  }
}

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#d4a373',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: true,
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [Game],
};

export const StartGame = (parent: string): Phaser.Game => {
  const game = new Phaser.Game({ ...config, parent });
  if (typeof window !== 'undefined') {
    (window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;
    (window as unknown as { __PHASER_EVENT_BUS__: typeof EventBus }).__PHASER_EVENT_BUS__ = EventBus;
  }
  return game;
};