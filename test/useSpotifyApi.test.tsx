import React, { useCallback } from "react";
import { render } from "@testing-library/react";
import { Context, useSpotifyPlayer } from "../src";


const POLL_PERIOD = 1000; // ms

export const TestComponent = (props) => {
  const { token } = props;

  const handlePlayingContext = useCallback((ctx: Context | null) => {
  }, []);

  const {
    context,
    deviceId,
    // devices,
    // disabled,
    // duration,
    paused,
    // position,
    repeat,
    shuffle,
    volume,
    handleNextTrack,
    handlePlay,
    handlePreviousTrack,
    handleRepeat,
    // handleSeek,
    handleShuffle,
    // handleVolumeChange,
    // getAvailableDevices,
    // transferPlayback,
  } = useSpotifyPlayer({
    token,
    pollPeriod: POLL_PERIOD,
    onContextChanged: handlePlayingContext
  });

  return (
    <div id="test-container">
      <p>Device Id: {deviceId}</p>
      <p>Track Name: {context?.current?.name}</p>
      <p>Playing: {!paused}</p>
      <p>Paused: {paused}</p>
      <p>Repeat: {repeat}</p>
      <p>Shuffle: {shuffle}</p>
      <p>Volume: {volume}</p>

      <button
        id="prev-track"
        onClick={handlePreviousTrack}
      >
        Prev Track
      </button>
      <button
        id="play"
        onClick={() => handlePlay(paused)}
      >
        Prev Track
      </button>
      <button
        id="next-track"
        onClick={handleNextTrack}
      >
        Next Track
      </button>

      <button
        id="repeat"
        onClick={handleRepeat}
      >
        Repeat
      </button>
      <button
        id="Shuffle"
        onClick={handleShuffle}
      >
        Shuffle
      </button>
    </div>
  );
}

describe("useSpotifyPlayer", () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  it("renders", () => {
    const { container } = render(<TestComponent />);
    expect(container.querySelector("#remove-data")).toBeDefined();
  });
});