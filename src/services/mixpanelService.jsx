import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import mixpanel from "mixpanel-browser";
import {
  selectLocalPeerID,
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectSessionId,
  useHMSStore,
} from "@100mslive/react-sdk";

export const mixpanelInit = () => {
  mixpanel.init("0ffb1d2f068153f2a6de3084bad3fadb", {
    debug: true,
    track_pageview: true,
  });
};

export const mixpanelIdentify = localPeerId => {
  mixpanel.identify(localPeerId);
};

export function sendEvent(eventName, eventData) {
  mixpanel.track(eventName, eventData);
}

const useMixpanelWithPeerDetails = () => {
  const [peerDetails, setPeerDetails] = useState();
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const localPeerName = useHMSStore(selectLocalPeerName);
  const sessionId = useHMSStore(selectSessionId);
  const { roomId } = useParams();

  useEffect(() => {
    setPeerDetails({
      userDisplayName: localPeerName,
      userRole: localPeerRole,
      userId: localPeerId,
      sessionId,
      roomId,
    });
  }, [localPeerName, localPeerRole, localPeerId, sessionId, roomId]);

  return (eventName = "DEFAULT_EVENT", eventData = {}) => {
    sendEvent(eventName, { ...peerDetails, ...eventData });
  };
};

export default useMixpanelWithPeerDetails;
