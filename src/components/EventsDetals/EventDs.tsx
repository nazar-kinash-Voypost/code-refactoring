import React, { useReducer, useEffect, useState } from "react";

import { Snackbar } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";

import "date-fns";

import { useGetSharedAccessQuery, User } from "../graphql/generated";

import convertMStoTimeLeft from "../common/convertMSToTimeLeft";

import EventDeleteModal from "./EventDeleteModal";
import { EventDetailsProps, NotificationItem, PeriodType } from "../../typts";
import { dispatch, eventForm, getNotificationSettings, notificationSettingsData } from "../../common/helpers";
import DialogComponent from "../DialogComponrnt/DialogComponent";
import {
  createError,
  createEventData,
  updateError,
  updateEventData,
  deleteEventMutation,
} from "../../mutations/mutations";

const EventDetails = ({
  event,
  open,
  setOpen,
  onDialogClose,
  refetchEvents,
  message,
  onEventCreation,
  onEventDelition,
  onCreateEventFromMessageItem,
  currentUser,
  messageId,
  messageTitle,
  isMessageDone,
  isMessageDeleted,
}: EventDetailsProps) => {
  const { data: sharedData, loading: sharedDataLoading } = useGetSharedAccessQuery();

  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState<boolean>(false);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);

  const [notifications, setNotifications] = useState<object[]>([]);
  const [sharingUsers, setSharingUsers] = useState<User[]>([]);

  useEffect(() => {
    dispatch({
      field: "reset",
    });
  }, [event, notifications, sharingUsers]);

  useEffect(() => {
    if (message?.tags?.length) {
      getNotificationSettings({ variables: { tagId: message.tags[0].id } });
    }
  }, [message, getNotificationSettings]);

  const handleDeleteEvent = async () => {
    if ("id" in eventForm) {
      setIsOpenModalConfirm(false);
      await deleteEventMutation({
        variables: {
          eventId: eventForm.id,
        },
      });
    }
  };

  useEffect(() => {
    if (updateEventData && !updateError) {
      setSuccessMessageOpen(true);
      setOpen(false);
    }
  }, [updateEventData, updateError, setOpen]);

  useEffect(() => {
    if (createEventData && !createError) {
      setSuccessMessageOpen(true);
      setOpen(false);
    }
  }, [createEventData, createError, setOpen]);

  useEffect(() => {
    if (!sharedDataLoading && sharedData?.sharedAccess?.targetUsers) {
      let sharedUsers: User[] = [];

      if (sharedData?.sharedAccess?.targetUsers) {
        sharedUsers = [...sharedData?.sharedAccess?.targetUsers];
        const isInclude = sharedUsers.find(({ id }) => id === currentUser.id);
        if (!isInclude) {
          sharedUsers.unshift(currentUser);
        }
      }

      const initialNotificationPeriod: NotificationItem[] = [];

      const periodTypeMap = {
        weeks: "Week",
        days: "Day",
        hours: "Hour",
        minutes: "Minute",
      };

      if (!event) {
        if (
          notificationSettingsData?.notificationSettingsByTag?.items &&
          notificationSettingsData?.notificationSettingsByTag?.items?.length > 0
        ) {
          notificationSettingsData.notificationSettingsByTag.items.forEach((item) => {
            const { type, value } = convertMStoTimeLeft(item.notifyBefore);
            const tsType = type as keyof typeof periodTypeMap;
            sharedUsers.forEach((sharedUser) => {
              initialNotificationPeriod.push({
                userId: sharedUser.id,
                periodType: periodTypeMap[tsType] as PeriodType,
                period: value.toString(),
              });
            });
          });
        } else {
          sharedUsers.forEach((sharedUser) => {
            initialNotificationPeriod.push({
              userId: sharedUser.id,
              periodType: periodTypeMap.minutes as PeriodType,
              period: "10",
            });
          });
        }
      } else if (event?.notifications && event?.notifications?.length > 0) {
        event.notifications.forEach((notififcation) => {
          const { type, value } = convertMStoTimeLeft(notififcation.notifyBefore);
          const tsType = type as keyof typeof periodTypeMap;
          initialNotificationPeriod.push({
            userId: notififcation.userId,
            periodType: periodTypeMap[tsType] as PeriodType,
            period: value.toString(),
          });
        });
      }
      setNotifications(initialNotificationPeriod);
      setSharingUsers(sharedUsers);
    }
  }, [event, sharedDataLoading, notificationSettingsData, currentUser, sharedData]);

  // 16:00 => 1600 for number mask

  const handleClose = () => setIsOpenModalConfirm(false);

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={successMessageOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessMessageOpen(false)}
      >
        <MuiAlert severity="success">Event has been saved</MuiAlert>
      </Snackbar>
      <DialogComponent
        open={open}
        event={event}
        setOpen={setOpen}
        onDialogClose={onDialogClose}
        refetchEvents={refetchEvents}
        message={message}
        onEventCreation={onEventCreation}
        onCreateEventFromMessageItem={onCreateEventFromMessageItem}
        currentUser={currentUser}
        messageId={messageId}
        messageTitle={messageTitle}
        isMessageDone={isMessageDone}
        isMessageDeleted={isMessageDeleted}
        notifications={notifications}
        setIsOpenModalConfirm={setIsOpenModalConfirm}
        sharingUsers={sharingUsers}
        sharedData={sharedData}
      />
      <EventDeleteModal
        isOpenModalConfirm={isOpenModalConfirm}
        handleClose={handleClose}
        handleDeleteEvent={handleDeleteEvent}
      />
    </>
  );
};

export default EventDetails;
