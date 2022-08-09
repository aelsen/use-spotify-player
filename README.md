# use-spotify-player

A React hook for using the Spotify Web Player for both local and remote playback.

The Spotify APIs and their terms are available [here](https://developer.spotify.com/documentation/).

## Installation 

Yarn

`yarn add use-spotify-player`


NPM

`npm i use-spotify-player`

## Basic Usage

The hook handles everything from player client creation to Web API requests to manage playback. It simply needs your Spotify access token, scoped for web playback, an optional poll period, and callback when the playback context or track has changed.

### Access Token

An access token is necessary for the Spotify Web Player client creation, unfortunately, so you will need to handle your token in your front end.
For security, your access token should be as limited as possible in terms of scope, to prevent token misuse.

e.g.

```
[
  "streaming",
  "user-read-email",  // I have found this is necessary for playback, YMMV
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state"
];
```

[More on Spotify Authorization Scopes](https://developer.spotify.com/documentation/general/guides/authorization/scopes/)



### Example

```jsx
import React, { useCallback } from "react";
import { Context, useSpotifyPlayer } from "use-spotify-player";


const POLL_PERIOD = 1000; // ms


export const SpotifyPlayback = (props) => {
  const { token } = props;

  const handlePlayingContext = useCallback((ctx: Context | null) => {
    // do something with the context, either the track or context (album, playlist) has changed
  }, []);

  const {
    context,
    deviceId,
    devices,
    disabled,
    duration,
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
    transferPlayback,
  } = useSpotifyPlayer({
    token,
    pollPeriod: POLL_PERIOD,
    onContextChanged: handlePlayingContext
  });

  return (
    <div>
      { /* A component that renders the track metadata */ }
      <div>
        {context?.current && <SongInfo track={context?.current} />}
      </div>
      
      { /* A component that renders the player controls and track slider */ }
      <PlayControls
        disabled={disabled}
        duration={duration}
        paused={paused}
        position={position}
        repeat={repeat}
        shuffle={shuffle}
        onPlay={() => handlePlay(true)}
        onPause={() => handlePlay(false)}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        onRepeat={handleRepeat}
        onSeek={handleSeek}
        onShuffle={handleShuffle}
      />

      { /* A component that renders a device menu and the player' volume */ }
      <DeviceMenu
        deviceId={deviceId}
        devices={devices}
        disabled={disabled}
        volume={volume}
        onVolume={handleVolumeChange}
        getAvailableDevices={getAvailableDevices}
        transferPlayback={transferPlayback}
      />
    </div>
  );
}

```


## TODO

- [ ] Tests

### Bugs

- [ ] Context flickers occasionally when next or previous tracks are requested too quickly