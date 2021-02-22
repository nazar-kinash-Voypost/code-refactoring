import React, { useState, useEffect } from "react";
import { Button, Grid, CircularProgress } from "@material-ui/core";
import { File, UpdateEventInput, EventNotificationInput, GetSharedAccessQuery } from "../graphql/generated";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import moment from "moment";
import { NotificationItem } from "../../typts";
import { useStyles } from "../../style/stylesComponrnts";
import { dispatch, eventForm, getNotificationSettings, periodRate } from "../../common/helpers";
import { createError, createEventMutation, updateError, updateEventMutation } from "../../mutations/mutations";
import FormHeadersPart from "../FormHeadersPart/FormHeadersPart";
import FormMainPart from "../FoymMainPart/FormMainPart";
import { updateLoading, createLoading } from "../../mutations/mutations";

const Form = ({
  event,
  setOpen,
  onDialogClose,
  refetchEvents,
  message,
  onEventCreation,
  onCreateEventFromMessageItem,
  currentUser,
  messageId,
  messageTitle,
  isMessageDone,
  isMessageDeleted,
  notifications,
  setIsOpenModalConfirm,
  sharingUsers,
  sharedData,
}) => {
  const [allDay, setAllDay] = useState<boolean>(false);

  const [files, setFiles] = useState<File[]>([]);
  const [sharedDataAccess, setSharedDataAccess] = useState<GetSharedAccessQuery | undefined | null>(null);

  const hasGraphQlConflictError = () => {
    if (createError?.graphQLErrors && createError?.graphQLErrors.length > 0) {
      const error = createError.graphQLErrors[0] as any;
      if (error.code === "has_conflict") {
        return true;
      }
    }

    if (updateError?.graphQLErrors && updateError?.graphQLErrors.length > 0) {
      const error = updateError.graphQLErrors[0] as any;
      if (error.code === "has_conflict") {
        return true;
      }
    }

    return false;
  };
  useEffect(() => {
    setSharedDataAccess(sharedData);
  }, [sharedData]);

  const handleFormSave = async (eventDom: React.FormEvent<HTMLFormElement>) => {
    eventDom.preventDefault();

    const { title, startTime, endTime, location, description, notifications, attachmentIds } = normaliseEventForm();

    if (event) {
      await updateEventMutation({
        variables: {
          eventId: event.id,
          title,
          startTime,
          endTime,
          location,
          description,
          allDay,
          notifications,
          attachmentIds,
        },
      }).catch((err) => console.log(`Event update error: ${err}`));
    } else if (message) {
      try {
        // TODO: Fix the types. In rush atm to demo this
        const newEvent: any = await createEventMutation({
          variables: {
            messageId: message.id,
            title,
            startTime,
            endTime,
            location,
            description,
            allDay,
            notifications,
            attachmentIds,
          },
        });
        const data = newEvent.data;

        const hasConflict = hasGraphQlConflictError();
        if (hasConflict) {
          return;
        }

        if (data?.createEvent && onCreateEventFromMessageItem) {
          onCreateEventFromMessageItem(data.createEvent.id, data?.createEvent);
        }
        if (data?.createEvent && onEventCreation) {
          await onEventCreation(data.createEvent.id, data?.createEvent);
        }
      } catch (error) {
        console.log(`Event update error: ${error}`);
      }
    } else {
      return;
    }
    if (!createError && !updateError) {
      if (refetchEvents) {
        refetchEvents();
      }
      if (onDialogClose) {
        onDialogClose();
      }
    }
  };

  useEffect(() => {
    if (message?.tags?.length) {
      getNotificationSettings({ variables: { tagId: message.tags[0].id } });
    }
  }, [message, getNotificationSettings]);

  useEffect(() => {
    setSharedDataAccess(sharedData);
  }, [sharedData]);

  useEffect(() => {
    const eventFiles = event?.attachments || message?.files || [];
    if (eventFiles) {
      setFiles(eventFiles as File[]);
    } else {
      setFiles([]);
    }
  }, [event, message]);

  useEffect(() => {
    dispatch({
      field: "reset",
    });
  }, [event, notifications, sharingUsers]);

  const normaliseEventForm = (): UpdateEventInput => {
    const startTime = moment(`${eventForm.startDate} ${eventForm.startTime}`, "l HH:mm").format();

    const endTime = moment(`${eventForm.endDate} ${eventForm.endTime}`, "l HH:mm").format();

    let startTimeUTC = startTime;
    let endTimeUTC = endTime;
    // Converting dates to UTC for all day,
    // because nylas shows wrong date range with local time
    if (allDay) {
      startTimeUTC = moment(startTime).utcOffset(0, true).format();
      endTimeUTC = moment(endTime).utcOffset(0, true).format();
    }

    const normalizedNotifications: EventNotificationInput[] = [];

    eventForm.notifications.forEach((item: NotificationItem) => {
      if (item?.period && Number(item?.period) > 0 && item.userId !== "none") {
        normalizedNotifications.push({
          userId: item.userId,
          notifyBefore: Number(item.period) * periodRate[item.periodType],
        });
      }
    });

    return {
      title: eventForm.title,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      location: eventForm.location,
      description: eventForm.description,
      notifications: normalizedNotifications,
      attachmentIds: files.map((attach) => attach.id),
    };
  };

  const classes = useStyles();
  return (
    <form onSubmit={handleFormSave}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Grid className={classes.headerPart} container spacing={2} alignItems="center">
          <FormHeadersPart setAllDay={setAllDay} allDay={allDay} />
        </Grid>
        <Grid container spacing={2} alignItems="center">
          <FormMainPart
            event={event}
            message={message}
            sharingUsers={sharingUsers}
            setOpen={setOpen}
            messageTitle={messageTitle}
            currentUser={currentUser}
            messageId={messageId}
            isMessageDone={isMessageDone}
            isMessageDeleted={isMessageDeleted}
            sharedDataAccess={sharedDataAccess}
            hasGraphQlConflictError={hasGraphQlConflictError}
          />
        </Grid>
      </MuiPickersUtilsProvider>
      <Grid className={classes.actions} container alignItems="center" justify="space-between">
        <Grid item className={classes.lastUpdated}>
          {"Event update time goes here"}
        </Grid>
        <Grid item>
          <Button className={classes.deleteButton} onClick={() => setIsOpenModalConfirm(true)}>
            Delete
          </Button>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            type="submit"
            disabled={updateLoading || createLoading}
          >
            {updateLoading ? <CircularProgress size={25} /> : "Save"}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default Form;
