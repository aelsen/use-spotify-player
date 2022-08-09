export enum RepeatState {
  OFF = 0,
  CONTEXT = 1,
  TRACK = 2,
};

export type Item = {
  name: string;
  uri?: string;
  url?: string;
}

export interface TrackSimple extends Item {
  album: Item & {
    image: {
      url: string;
    }
  };
  artists: Item[];
}

export interface ContextTrack extends TrackSimple {
  id: string;
  position: number | null;
  uri: string; 
}

export interface Context {
  id: string | null;
  
  name: string | null;
  uri: string | null;
  url: string | null;
  type: string;

  length: number;

  current: ContextTrack;
  next: ContextTrack[];
  prev: ContextTrack[];
};

export interface Device {
  id: string;
  is_active: boolean;
  name: string;
  type: string;
};

export interface PlayContext {
  uri?: string | null;
  position?: number;
  offset?: {
    position: number | null;
    uri?: string; 
  };
}

export interface PlayerState {
  disabled: boolean;
  duration: number;
  local: boolean;
  position: number;
  paused: boolean;
  repeat: RepeatState;
  shuffle: boolean;
  volume: number;
};
