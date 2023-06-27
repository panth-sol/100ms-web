import mixpanel from "mixpanel-browser";

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
  console.log(eventName, eventData);
  mixpanel.track(eventName, eventData);
}
