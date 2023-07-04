/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import isEmpty from "lodash/isEmpty";
import {
  selectHMSStats,
  selectLocalPeerRoleName,
  useHMSStatsStore,
  useHMSStore,
} from "@100mslive/react-sdk";
import { useTracksWithLabel } from "../components/StatsForNerds";
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
    "Packets Lost": stats?.subscribe?.packetsLost || "0",
    Jitter: stats?.subscribe?.jitter || "0",
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

const getHostStatData = stats => {
  if (isEmpty(stats)) {
    return null;
  }

  let hostStat = {
    "Peer Name": stats?.peerName,
    "Peer Id": stats?.peerId,
    Bitrate: formatBytes(stats?.bitrate, "b/s"),
    Jitter: stats?.jitter?.toFixed(3) || "0",
    codec: stats?.codec,
    type: stats?.type,
    codecId: stats?.codecId,
    kind: stats?.kind,
  };

  if (!isEmpty(stats?.packetsLost)) {
    hostStat = {
      ...hostStat,
      "Packets Lost": stats?.packetsLost || "0",
    };
  }

  const inbound = stats?.type?.includes("inbound");

  if (inbound) {
    hostStat = {
      ...hostStat,
      "Bytes Received": formatBytes(stats?.bytesReceived),
    };
  } else {
    hostStat = {
      ...hostStat,
      "Bytes Sent": formatBytes(stats?.bytesSent),
    };
  }

  if (stats.kind === "video") {
    hostStat = {
      ...hostStat,
      Framerate: stats?.framesPerSecond,
    };
    if (inbound && !isEmpty(stats?.qualityLimitationReason)) {
      hostStat = {
        ...hostStat,
        "Quality Limitation Reason": stats?.qualityLimitationReason,
      };
    }
  }

  if (!isEmpty(stats?.frameWidth) && !isEmpty(stats?.frameHeight)) {
    hostStat = {
      ...hostStat,
      "Video size": `${stats?.frameWidth} x ${stats?.frameHeight}`,
    };
  }

  if (!isEmpty(stats?.roundTripTime)) {
    hostStat = {
      ...hostStat,
      "Round Trip Time": `${
        stats?.roundTripTime ? `${stats.roundTripTime * 1000} ms` : "-"
      }`,
    };
  }
  return hostStat;
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
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);

  const tracksWithLabels = useTracksWithLabel();
  const hostVideoTrackId = tracksWithLabels.filter(
    track =>
      !track.local &&
      track.label.includes("teacher") &&
      track.label.includes("video")
  )?.[0]?.id;
  const hostVideoStats = getHostStatData(
    useHMSStatsStore(selectHMSStats.trackStatsByID(hostVideoTrackId))
  );

  const hostAudioTrackId = tracksWithLabels.filter(
    track =>
      !track.local &&
      track.label.includes("teacher") &&
      track.label.includes("audio")
  )?.[0]?.id;
  const hostAudioStats = getHostStatData(
    useHMSStatsStore(selectHMSStats.trackStatsByID(hostAudioTrackId))
  );

  const sendHostEvent = () => {
    if (localPeerRole.toLowerCase().includes("guest")) {
      !isEmpty(hostVideoStats) &&
        sendMixpanelEvent("HOST_VIDEO_STATS", hostVideoStats);
      !isEmpty(hostAudioStats) &&
        sendMixpanelEvent("HOST_AUDIO_STATS", hostAudioStats);
    }
  };

  const sendEvent = useCallback(() => {
    sendMixpanelEvent("AV_STATS", avStats);
    sendHostEvent();
  }, [avStats, sendMixpanelEvent]);

  useEffect(() => {
    sendEvent();
  }, [avStats]);

  return <></>;
};

export default memo(CaptureStats);
