import { useCallback, useEffect, useRef, useState } from "react";

import { useInterval } from "./useInterval";
import {
  CONTEXT_TRACK_WINDOW,
  createTrackContextFromApi,
  createTrackContextFromPlayer,
  getDevices,
  getPlayerState,
  setPlayerDevice,
  setPlayerPause,
  setPlayerPlayContext,
  setPlayerPosition,
  setPlayerRepeat,
  setPlayerShuffle,
  setPlayerVolume,
  transformContextTrack,
} from "./rest";
import { Context, Device, PlayerState, RepeatState } from "./types";
import { mod } from "./utils";


const POLL_PERIOD = 1000; // ms

const initialState: PlayerState = {
  disabled: true,
  duration: 600,
  local: true,
  paused: true,
  position: 0,
  repeat: RepeatState.OFF,
  shuffle: false,
  volume: 50,
};

interface SpotifyPlayerArgs {
  token: string;
  onContextChanged?: (context: Context | null) => void,
  pollPeriod?: number;
};

export const useSpotifyPlayer = ({ token, pollPeriod = POLL_PERIOD, onContextChanged }: SpotifyPlayerArgs) => {
  const contextRef = useRef<Context | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(initialState);
  const playerRef = useRef<any>(null);
  const { startInterval, stopInterval } = useInterval();

  const player = playerRef.current;
  const {
    disabled,
    duration,
    local,
    paused,
    position,
    repeat,
    shuffle,
    volume
  } = playerState;

  const getAvailableDevices = useCallback(async () => {
    const devices = await getDevices();
    setDevices(devices);
  }, []);

  const transferPlayback = async (deviceId: string) => {
    setPlayerDevice(deviceId);
  };

  const updatePlayerPositionByInterval = useCallback(() => {
    if (!playerRef.current) {
      stopInterval("seek");
      return;
    }
    setPlayerState((prev) => ({ ...prev, position: prev.position + POLL_PERIOD }));
  }, [stopInterval]);


  const handleRepeat = async () => {
    const next = ((playerState.repeat as number) + 1) % 3;
    const state = RepeatState[next].toLowerCase();
    await setPlayerRepeat(state as unknown as RepeatState);
   setPlayerState((prev) => ({ ...prev, repeat: next }));
  }

  const handleShuffle = async () => {
    await setPlayerShuffle(!shuffle);
    setPlayerState((prev) => ({ ...prev, shuffle: !shuffle }));
  }

  const handleSeek = (position) => {
    if (local) 
      player?.seek(position);
    else
      setPlayerPosition(position);
  }

  const handlePlay = (play: boolean) => {
    if (play) {
      if (local)
        player?.resume();
      else
        setPlayerPlayContext({ position });

    } else {
      if (local)
        player?.pause();
      else
        setPlayerPause();
    }
  }

  const handleNextTrack = () => {
    const context = contextRef.current;
    const restart = repeat === RepeatState.TRACK;

    if (restart) {
      if (local) {
        player.seek(0);

      } else {
        setPlayerPosition(0);
        setPlayerState((prev) => ({ ...prev, position: 0 }));
      }

    } else {
      if (local) {
        player.nextTrack();

      } else {
        if (!context) return;
        const offset: any = {};
        const next = context.next[0];
  
        const newContext = {
          ...context,
          prev: [context.current, ...context.prev],
          next: context.next.slice(1),
          current: next,
        };

        if (next) {
          offset.position = next.position !== null ? next.position : next.uri;
        } else {
          offset.position = mod(context.current.position! + 1, context.length);
        }
  
        setPlayerPlayContext({ position: 0, uri: context.uri, offset });
        setPlayerState((prev) => ({ ...prev, position: 0 }));
        onContextChanged?.(newContext);
        contextRef.current = newContext;
      }
    };
  }

  const handlePreviousTrack = async () => {
    const context = contextRef.current;
    const restart = repeat === RepeatState.TRACK || position > 5000;

    if (restart) {
      if (local) {
        player.seek(0);

      } else {
        setPlayerPosition(0);
        setPlayerState((prev) => ({ ...prev, position: 0 }));
      }

    } else {
      if (local) {
        player.previousTrack();

      } else {
        if (!context) return;  
        const offset: any = {};
        const prev = context.prev[context.prev.length - 1];
  
        const newContext = {
          ...context,
          prev: context.prev.slice(0, -1),
          next: [context.current, ...context.next],
          current: prev,
        };

        if (prev) {
          offset.position = prev.position !== null ? prev.position : prev.uri;
        } else {
          offset.position = mod(context.current.position! - 1, context.length);
        }
  
        // console.log("Spotify Playback | Handle Prev Track --- using offset", offset, "setting next context", newContext);
        setPlayerPlayContext({ position: 0, uri: context.uri, offset });
        setPlayerState((prev) => ({ ...prev, position: 0, }));
        contextRef.current = newContext;
      }
    };
  }

  const handleVolumeChange = async (volume: number) => {
    await setPlayerVolume(volume);
    setPlayerState((prev) => ({ ...prev, volume }));
  };

  const handleState = useCallback(async (state: SpotifyApi.CurrentPlaybackResponse) => {
    const {
      context: ctx,
      device,
      is_playing,
      item,
      progress_ms: position,
      repeat_state,
      shuffle_state: shuffle
    } = state;
    const context = contextRef.current;
    const { volume_percent: volume } = device;
    const duration = item?.duration_ms || 0;
    const paused = !is_playing;
    const repeat = RepeatState[repeat_state.toUpperCase()] as unknown as RepeatState;
    
    if (!paused) startInterval(updatePlayerPositionByInterval, POLL_PERIOD, "seek");
    if (paused) stopInterval("seek");
    
    const newTrack = item
    ? transformContextTrack((item as SpotifyApi.TrackObjectFull))
    : null;
    
    // Check if context has changed
    const contextChanged = ctx?.uri !== context?.uri;
    const trackChanged = newTrack?.uri !== context?.current?.uri;
    const positionChanged = context && (context.next.length < CONTEXT_TRACK_WINDOW || context.prev.length < CONTEXT_TRACK_WINDOW);
    const stale = contextChanged || trackChanged || positionChanged;
    let newContext;
    if (stale) {
      newContext = await createTrackContextFromApi(state);
      contextRef.current = newContext;
      onContextChanged?.(newContext);
    }
    // console.log("Spotify Playback | Handle State, Fetched - setting next context", stale, newContext);
    // console.log("Spotify Playback | Handle State, Fetched --- context changed?", contextChanged, ctx?.uri, context?.uri);
    // console.log("Spotify Playback | Handle State, Fetched --- track changed?", trackChanged, newTrack?.uri, context?.current?.uri);
  
    setPlayerState((prev) => ({
      ...prev,
      position: position !== null ? position : prev.position,
      volume: volume !== null ? volume : prev.volume,
      duration,
      paused,
      repeat,
      shuffle,
    }));
  }, [onContextChanged, startInterval, stopInterval, updatePlayerPositionByInterval]);
  
  const handlePlayerStateChanged = useCallback(async (state: Spotify.PlaybackState) => {
    if (!state) {
      setPlayerState((prev) => ({ ...prev, local: false }));
      return;
    }

    const {
      context: ctx,
      duration,
      position,
      paused,
      repeat_mode: repeat,
      shuffle, track_window
    } = state;
    const context = contextRef.current;
    const volume = (await playerRef.current?.getVolume() || 0) * 100;
    const contextTrackUri = track_window.current_track?.uri;

    if (!paused) startInterval(updatePlayerPositionByInterval, POLL_PERIOD, "seek");
    if (paused) stopInterval("seek");
    
    // Check if context has changed
    const contextChanged = ctx.uri !== context?.uri;
    const trackChanged = contextTrackUri !== context?.current.uri;
    let newContext;
    if (contextChanged || trackChanged) {
      newContext = await createTrackContextFromPlayer(state);
      contextRef.current = newContext;
    }

    setPlayerState((prev) => ({
      ...prev,
      duration,
      paused,
      position,
      repeat,
      shuffle,
      volume,
      local: true,
    }));
  }, [startInterval, stopInterval, updatePlayerPositionByInterval]);

  const getState = useCallback(async () => {
    const state = await getPlayerState();
    if (!state) return;

    handleState(state);
  }, [handleState]);

  const initPlayer = useCallback(() => {
    if (!token) return;
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player: Spotify.Player = new (window as any).Spotify.Player({
        name: "constellation.fm",
        getOAuthToken: (cb: any) => { cb(token); },
        volume: 0.5
      });

      playerRef.current = player;
      (player as any).activateElement();

      player.addListener('ready', (device: any) => {
        console.log('Spotify Playback | Ready with Device ID', device);
        setDeviceId(device.device_id);
        setPlayerState((prev) => ({ ...prev, disabled: false }));
        getState();
      });
      
      player.addListener('not_ready', () => {
        setDeviceId(null);
        setPlayerState((prev) => ({ ...prev, disabled: true }));
      });

      player.addListener('initialization_error', ({ message }) => { 
        console.error(message);
      });
    
      player.addListener('authentication_error', ({ message }) => {
        console.error(message);
      });
    
      player.addListener('account_error', ({ message }) => {
        console.error(message);
      });

      player.addListener('player_state_changed', (handlePlayerStateChanged));
      player.connect();
    };
  }, [token, getState, handlePlayerStateChanged]);

  const handleDevices = useCallback(() => {
    const local = !!devices.find(({ id }) => id === deviceId)?.is_active;
    setPlayerState((prev) => ({ ...prev, local }));
  }, [deviceId, devices]);

  const handleDismount = useCallback(() => {
    return stopInterval;
  }, [stopInterval]);

  const handlePlaybackSubscription = useCallback(() => {
    if (!local) {
      startInterval(getState, POLL_PERIOD, "state");
      return;
    }
    stopInterval("state");
  }, [getState, local, startInterval, stopInterval]);

  useEffect(() => {
    initPlayer();
    return () => {
      
    }
  }, [initPlayer, token, pollPeriod, handlePlayerStateChanged]);
  useEffect(handleDevices, [handleDevices]);
  useEffect(handleDismount, [handleDismount]);
  useEffect(handlePlaybackSubscription, [handlePlaybackSubscription]);

  return {
    context: contextRef.current,
    deviceId,
    devices,
    disabled,
    duration,
    local,
    paused,
    position,
    repeat,
    shuffle,
    volume,
    handleNextTrack,
    handlePlay,
    handlePreviousTrack,
    handleRepeat,
    handleSeek,
    handleShuffle,
    handleVolumeChange,
    getAvailableDevices,
    transferPlayback
  };
}
