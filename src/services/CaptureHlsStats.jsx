/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { getDurationFromSeconds } from "../components/HMSVideo/HMSVIdeoUtils";
import useMixpanelWithPeerDetails from "../services/mixpanelService";

export const getHlsStatData = hlsStatsState => {
  console.log("==> getHlsStatData ==>", hlsStatsState);
  return {
    "Stream url": hlsStatsState?.url || "NA",
    "Video size":
      `${hlsStatsState?.videoSize?.width}x${hlsStatsState?.videoSize?.height}` ||
      "NA",
    "Buffer duration": hlsStatsState?.bufferedDuration?.toFixed(2) || "0",
    "Connection speed": `${(
      hlsStatsState?.bandwidthEstimate /
      (1000 * 1000)
    ).toFixed(2)} Mbps`,
    Bitrate: `${(hlsStatsState?.bitrate / (1000 * 1000)).toFixed(2)} Mbps`,
    "distance from live": `${getDurationFromSeconds(
      hlsStatsState?.distanceFromLive / 1000
    )} seconds`,
    "Dropped frames": hlsStatsState?.droppedFrames || "0",
  };
};

export const useGetHlsStats = (hlsStatsState, intervalInMS) => {
  const temp = useRef(getHlsStatData(hlsStatsState));
  const [hlsStats, setHlsStats] = useState({});

  const updateStats = useCallback(() => {
    setHlsStats(temp.current);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateStats();
    }, intervalInMS);

    // Clean up the interval when the component unmounts or when the dependency changes
    return () => {
      clearInterval(intervalId);
    };
  }, [intervalInMS]);

  useEffect(() => {
    temp.current = getHlsStatData(hlsStatsState);
  }, [
    hlsStatsState?.url,
    hlsStatsState?.videoSize?.width,
    hlsStatsState?.videoSize?.height,
    hlsStatsState?.bufferedDuration,
    hlsStatsState?.bandwidthEstimate,
    hlsStatsState?.bitrate,
    hlsStatsState?.distanceFromLive,
    hlsStatsState?.droppedFrames,
  ]);

  return hlsStats;
};

const CaptureStats = ({ hlsStatsState, intervalInMS }) => {
  const hlsStats = useGetHlsStats(hlsStatsState, intervalInMS);
  const sendMixpanelEvent = useMixpanelWithPeerDetails();

  const sendEvent = useCallback(() => {
    sendMixpanelEvent("HLS_STATS", hlsStats);
  }, [hlsStats, sendMixpanelEvent]);

  useEffect(() => {
    sendEvent();
  }, [hlsStats]);

  return <></>;
};

export default memo(CaptureStats);
