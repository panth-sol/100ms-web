import { useEffect, useState } from "react";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { Dialog, Flex, Loading, Text } from "@100mslive/react-ui";
import { ToastConfig } from "../Toast/ToastConfig";
import { ToastManager } from "../Toast/ToastManager";
// import { logMessage } from "zipyai";
import { logMessage } from "../../services/analytics";
import useMixpanelWithPeerDetails from "../../services/mixpanelService";

const notificationTypes = [
  HMSNotificationTypes.RECONNECTED,
  HMSNotificationTypes.RECONNECTING,
  HMSNotificationTypes.ERROR,
];
let notificationId = null;

// const isQA = process.env.REACT_APP_ENV === "qa";
const isQA = true;
export const ReconnectNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  const [open, setOpen] = useState(false);
  const sendMixpanelEvent = useMixpanelWithPeerDetails();
  useEffect(() => {
    if (
      notification?.type === HMSNotificationTypes.ERROR &&
      notification?.data?.isTerminal
    ) {
      logMessage("Error ", notification.data?.description);
      sendMixpanelEvent("NOTIFICATION", {
        notificationType: "Error",
        notificationDesc: notification.data?.description,
      });
      setOpen(false);
    } else if (notification?.type === HMSNotificationTypes.RECONNECTED) {
      logMessage("Reconnected");
      sendMixpanelEvent("NOTIFICATION", {
        notificationType: "Reconnected",
      });
      notificationId = ToastManager.replaceToast(
        notificationId,
        ToastConfig.RECONNECTED.single()
      );
      setOpen(false);
    } else if (notification?.type === HMSNotificationTypes.RECONNECTING) {
      logMessage("Reconnecting");
      sendMixpanelEvent("NOTIFICATION", {
        notificationType: "Reconnecting",
      });
      if (isQA) {
        ToastManager.removeToast(notificationId);
        setOpen(true);
      } else {
        notificationId = ToastManager.replaceToast(
          notificationId,
          ToastConfig.RECONNECTING.single(notification.data.message)
        );
      }
    }
  }, [notification, sendMixpanelEvent]);
  if (!open || !isQA) return null;
  return (
    <Dialog.Root open={open} modal={true}>
      <Dialog.Portal container={document.getElementById("conferencing")}>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            width: "fit-content",
            maxWidth: "80%",
            p: "$4 $8",
            position: "relative",
            top: "unset",
            bottom: "$9",
            transform: "translate(-50%, -100%)",
            animation: "none !important",
          }}
        >
          <Flex align="center">
            <div style={{ display: "inline", margin: "0.25rem" }}>
              <Loading size={16} />
            </div>
            <Text css={{ fontSize: "$space$8", color: "$textHighEmp" }}>
              You lost your network connection. Trying to reconnect.
            </Text>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
