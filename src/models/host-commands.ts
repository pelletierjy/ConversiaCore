import { SchemaType, type FunctionCall, type FunctionDeclaration } from '@google/generative-ai';

/** Wire contract for the tutor widget telling a host page to change its own state.
 *  Dispatched as a `conversia-app:command` CustomEvent from the widget's shadow tree
 *  (bubbles + composed, so it crosses the shadow boundary to the host's listener). */
export const HOST_COMMAND_PROTOCOL_VERSION = 1;

export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ScaleMode = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';
export type Instrument = 'guitar' | 'piano' | 'kalimba' | 'harmonica' | 'flute' | 'recorder';
export type SoundEngine = 'sample' | 'synth' | 'sine';

export type HostCommand =
  | {
      type: 'setScaleDisplay';
      root?: Note;
      scaleType?: string;
      mode?: ScaleMode;
      highlightRoots?: boolean;
      showFlats?: boolean;
      showDegrees?: boolean;
    }
  | { type: 'setInstrument'; value: Instrument }
  | { type: 'setChordScaleMode'; value: boolean }
  | { type: 'setSoundEngine'; value: SoundEngine };

export interface HostCommandEventDetail {
  version: typeof HOST_COMMAND_PROTOCOL_VERSION;
  sessionId: string;
  commands: HostCommand[];
}

const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_MODES: ScaleMode[] = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
const INSTRUMENTS: Instrument[] = ['guitar', 'piano', 'kalimba', 'harmonica', 'flute', 'recorder'];
const SOUND_ENGINES: SoundEngine[] = ['sample', 'synth', 'sine'];

// Kept in sync by hand with ScalesViewer's src/lib/utils/scaleConstants.ts SCALE_TYPES.
// User-defined custom scale types live in that app's per-browser localStorage and are
// invisible here, so only built-in types can be offered to the model.
const SCALE_TYPES: string[] = [
  'major',
  'minor',
  'pentatonic',
  'minor-pentatonic',
  'blues',
  'bebop',
  'bebop-dominant',
  'bebop-major',
  'bebop-minor',
  'diminished',
  'whole-tone',
  'altered',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
  'lydian-dominant',
  'super-locrian',
  'melodic-minor',
  'harmonic-minor',
  'hungarian-minor',
  'ukrainian-dorian',
  'persian',
  'byzantine',
  'japanese',
  'hirajoshi',
  'in-sen',
  'iwato',
  'chromatic',
  'diminished-whole-half',
  'diminished-half-whole',
  'egyptian',
  'chinese',
  'japanese-pentatonic',
];

// `highlightRoots` is a confusing name in the host app (it drives what its own code calls
// "monochrome" root-note coloring), so the model needs the actual visual effect spelled out.
const SET_SCALE_DISPLAY: FunctionDeclaration = {
  name: 'set_scale_display',
  description: "Change the scale currently shown on ScalesViewer's fretboard/keyboard display. Only include the fields you want to change.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      root: { type: SchemaType.STRING, format: 'enum', enum: NOTES, description: 'The root note of the scale.' },
      scaleType: { type: SchemaType.STRING, format: 'enum', enum: SCALE_TYPES, description: 'The scale type (e.g. major, minor, pentatonic).' },
      mode: { type: SchemaType.STRING, format: 'enum', enum: SCALE_MODES, description: 'The mode of the scale, when applicable.' },
      highlightRoots: {
        type: SchemaType.BOOLEAN,
        description:
          'true = highlight the root note in its own color and show all other notes in one shared color ("monochrome" root-highlight mode). false = color each note by its scale-degree/interval instead.',
      },
      showFlats: { type: SchemaType.BOOLEAN, description: 'true = spell accidentals as flats (e.g. Bb); false = spell them as sharps (e.g. A#).' },
      showDegrees: { type: SchemaType.BOOLEAN, description: 'true = label each note with its scale degree number; false = label with note names.' },
    },
  },
};

const SET_INSTRUMENT: FunctionDeclaration = {
  name: 'set_instrument',
  description: 'Switch which instrument ScalesViewer displays the scale on.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      value: { type: SchemaType.STRING, format: 'enum', enum: INSTRUMENTS, description: 'The instrument to switch to.' },
    },
    required: ['value'],
  },
};

const SET_CHORD_SCALE_MODE: FunctionDeclaration = {
  name: 'set_chord_scale_mode',
  description: 'Toggle ScalesViewer between plain scale display and chord-scale (diatonic chords) display.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      value: { type: SchemaType.BOOLEAN, description: 'true = show the diatonic chords of the current scale; false = show the plain scale.' },
    },
    required: ['value'],
  },
};

const SET_SOUND_ENGINE: FunctionDeclaration = {
  name: 'set_sound_engine',
  description: 'Change the audio engine ScalesViewer uses to play notes.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      value: { type: SchemaType.STRING, format: 'enum', enum: SOUND_ENGINES, description: 'The sound engine to use.' },
    },
    required: ['value'],
  },
};

const HOST_COMMAND_REGISTRY: Record<string, FunctionDeclaration[]> = {
  ScalesViewer: [SET_SCALE_DISPLAY, SET_INSTRUMENT, SET_CHORD_SCALE_MODE, SET_SOUND_ENGINE],
};

/** Returns the Gemini function declarations available for a given host context, or undefined if none are registered. */
export function getHostCommandTools(contextKey: string | undefined): FunctionDeclaration[] | undefined {
  if (!contextKey) return undefined;
  return HOST_COMMAND_REGISTRY[contextKey];
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function parseSetScaleDisplay(args: Record<string, unknown>): HostCommand | undefined {
  const command: Extract<HostCommand, { type: 'setScaleDisplay' }> = { type: 'setScaleDisplay' };
  const root = asEnum(args.root, NOTES);
  if (root) command.root = root;
  const scaleType = asEnum(args.scaleType, SCALE_TYPES);
  if (scaleType) command.scaleType = scaleType;
  const mode = asEnum(args.mode, SCALE_MODES);
  if (mode) command.mode = mode;
  if (isBoolean(args.highlightRoots)) command.highlightRoots = args.highlightRoots;
  if (isBoolean(args.showFlats)) command.showFlats = args.showFlats;
  if (isBoolean(args.showDegrees)) command.showDegrees = args.showDegrees;
  const hasAnyField = command.root || command.scaleType || command.mode ||
    command.highlightRoots !== undefined || command.showFlats !== undefined || command.showDegrees !== undefined;
  return hasAnyField ? command : undefined;
}

/** Validates raw Gemini function calls against the registry for a context, dropping anything
 *  malformed or unregistered rather than throwing (the model's output is untrusted input). */
export function parseFunctionCallsToHostCommands(contextKey: string | undefined, functionCalls: FunctionCall[] | undefined): HostCommand[] {
  const tools = getHostCommandTools(contextKey);
  if (!tools || !functionCalls?.length) return [];

  const knownNames = new Set(tools.map((tool) => tool.name));
  const commands: HostCommand[] = [];

  for (const call of functionCalls) {
    if (!knownNames.has(call.name)) {
      console.warn(`[host-commands] Ignoring unknown function call "${call.name}" for context "${contextKey}".`);
      continue;
    }
    const args = (call.args ?? {}) as Record<string, unknown>;
    let command: HostCommand | undefined;
    switch (call.name) {
      case 'set_scale_display':
        command = parseSetScaleDisplay(args);
        break;
      case 'set_instrument': {
        const value = asEnum(args.value, INSTRUMENTS);
        command = value ? { type: 'setInstrument', value } : undefined;
        break;
      }
      case 'set_chord_scale_mode':
        command = isBoolean(args.value) ? { type: 'setChordScaleMode', value: args.value } : undefined;
        break;
      case 'set_sound_engine': {
        const value = asEnum(args.value, SOUND_ENGINES);
        command = value ? { type: 'setSoundEngine', value } : undefined;
        break;
      }
    }
    if (command) {
      commands.push(command);
    } else {
      console.warn(`[host-commands] Ignoring malformed args for function call "${call.name}":`, call.args);
    }
  }

  return commands;
}
