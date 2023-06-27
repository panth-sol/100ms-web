/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { selectHMSStats, useHMSStatsStore } from "@100mslive/react-sdk";
import useMixpanelWithPeerDetails from "../services/mixpanelService";

const formatBytes = (bytes, unit = "B", decimals = 2) => {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 " + unit;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["", "K", "M", "G", "T", "P", "E", "Z", "Y"].map(
    size => size + unit
  );

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getAVStatData = stats => {
  return {
    "Packets Lost": stats?.subscribe?.packetsLost || "-",
    Jitter: stats?.subscribe?.jitter || "-",
    "Publish Bitrate": formatBytes(stats?.publish?.bitrate, "b/s"),
    "Subscribe Bitrate": formatBytes(stats?.subscribe?.bitrate, "b/s"),
    "Available Outgoing Bitrate": formatBytes(
      stats?.publish?.availableOutgoingBitrate,
      "b/s"
    ),
    "Total Bytes Sent": formatBytes(stats?.publish?.bytesSent),
    "Round Trip Time": `${
      (
        ((stats?.publish?.currentRoundTripTime || 0) +
          (stats?.subscribe?.currentRoundTripTime || 0)) /
        2
      ).toFixed(3) * 1000
    } ms`,
  };
};

export const useGetAVStats = intervalInMS => {
  const stats = useHMSStatsStore(selectHMSStats.localPeerStats);
  const temp = useRef(getAVStatData(stats));
  const [avStats, setAvStats] = useState({});

  const updateStats = useCallback(() => {
    setAvStats(temp.current);
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
    temp.current = getAVStatData(stats);
  }, [
    stats?.publish?.availableOutgoingBitrate,
    stats?.publish?.bitrate,
    stats?.publish?.bytesSent,
    stats?.publish?.currentRoundTripTime,
    stats?.subscribe?.bitrate,
    stats?.subscribe?.currentRoundTripTime,
    stats?.subscribe?.jitter,
    stats?.subscribe?.packetsLost,
  ]);

  return avStats;
};

const CaptureStats = ({ intervalInMS }) => {
  const avStats = useGetAVStats(intervalInMS);
  const sendMixpanelEvent = useMixpanelWithPeerDetails();

  const sendEvent = useCallback(() => {
    sendMixpanelEvent("AV_STATS", avStats);
  }, [avStats, sendMixpanelEvent]);

  useEffect(() => {
    sendEvent();
  }, [avStats]);

  return <></>;
};

export default memo(CaptureStats);
