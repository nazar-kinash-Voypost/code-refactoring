import React, { useEffect, useState } from "react";

import {
  Button,
  Grid,
  TextField as TextFieldMaterial,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Box,
} from "@material-ui/core";

import { CloseOutlined as CloseOutlinedIcon } from "@material-ui/icons";

import { PdfPreview } from ".";

import { ReactComponent as ErrorOutlineIcon } from "../icons/errorOutline.svg";
import { ReactComponent as FileIcon } from "../icons/fileIcon.svg";

import { File, User, Calendar } from "../graphql/generated";

import TextField from "./TextField";
import ChipsInput from "./ChipsInput";

import { Link } from "react-router-dom";
import { createLink, dispatch, eventForm, periodTypes } from "../../common/helpers";
import { useStyles } from "../../style/stylesComponrnts";
import { NotificationItem } from "../../typts";

const FormMainPart = ({
  event,
  message,
  sharingUsers,
  setOpen,
  messageTitle,
  currentUser,
  messageId,
  isMessageDone,
  isMessageDeleted,
  sharedDataAccess,
  hasGraphQlConflictError,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = React.useState(0);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [calendarChips, setCalendarChips] = useState<string[]>([]);

  useEffect(() => {
    const eventFiles = event?.attachments || message?.files || [];
    if (eventFiles) {
      setFiles(eventFiles as File[]);
    } else {
      setFiles([]);
    }
  }, [event, message]);
  useEffect(() => {
    const chipSharedAccessValues: string[] = sharedDataAccess?.sharedAccess?.targetUsers
      ? sharedDataAccess.sharedAccess.targetUsers.map((user: User) => `${user?.name}'s Calendar`)
      : [];

    let userCalendars: string[] = [];
    if (currentUser) {
      userCalendars = currentUser.eventCalendars.map((calendar: Calendar) => `${calendar.name}`) || [];
    }

    const chipValues = [...chipSharedAccessValues, ...userCalendars];
    if (event?.nylasCalendarName) {
      chipValues.unshift(event.nylasCalendarName);
    }
    setCalendarChips(chipValues);
  }, [event, sharedDataAccess, currentUser]);

  const handleChipClick = (attachmentIndex: number) => {
    setCurrentAttachmentIndex(attachmentIndex);
    setPreviewOpen(true);
  };

  const link = createLink(currentUser.email, messageId, isMessageDone, isMessageDeleted);

  const classes = useStyles();
  return (
    <>
      <Grid item xs={9}>
        <TextField fullWidth size="small" variant="outlined" label="Calendar" value={calendarChips} />
      </Grid>
      <Grid
        item
        container
        xs={3}
        alignItems="center"
        className={hasGraphQlConflictError() ? classes.conflictError : ""}
      >
        <Box display="flex" mt={4}>
          <ErrorOutlineIcon className={classes.icon} />
          &nbsp;
          {event?.conflict || hasGraphQlConflictError() ? <>Has conflict.</> : <>No Conflict</>}
        </Box>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          label="Address"
          value={eventForm.location}
          onChange={(e: React.FormEvent<HTMLFormElement>) =>
            dispatch({
              field: "location",
              value: e.currentTarget.value,
            })
          }
        />
      </Grid>
      <Grid item xs={12}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={6}>
            <Link className={classes.linkStyles} to={link}>
              <TextField
                onClick={() => setOpen(false)}
                fullWidth
                size="small"
                variant="outlined"
                label="Mail"
                InputProps={{
                  className: classes.multilineColor,
                }}
                value={messageTitle || message?.caseStyle || message?.subject || event?.message?.caseStyle || ""}
              />
            </Link>
          </Grid>
          <Grid item xs={6}>
            <ChipsInput
              value={event?.message?.tags?.map((tag) => tag.name) || message?.tags.map((tag) => tag.name) || []}
              label="Category:"
              isLineType
              borderType="square"
              withBorder
            />
          </Grid>
        </Grid>
      </Grid>
      {eventForm.notifications.map((notify: NotificationItem, index: number) => (
        <>
          <Grid item xs={4}>
            <FormControl variant="outlined" size="small" fullWidth>
              <Select
                value={notify.userId}
                onChange={(e) =>
                  dispatch({
                    field: `notification:${index}:userId`,
                    value: e.target.value as string,
                  })
                }
              >
                <MenuItem value="none">
                  <em>None</em>
                </MenuItem>
                {sharingUsers.map((item) => (
                  <MenuItem value={item.id} key={item.id}>
                    <em>{`${item.name} (Notification)`}</em>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <TextFieldMaterial
              fullWidth
              value={notify.period}
              type="number"
              size="small"
              variant="outlined"
              onChange={(e) =>
                dispatch({
                  field: `notification:${index}:period`,
                  value: e.target.value as string,
                })
              }
            />
          </Grid>
          <Grid item xs={3}>
            <FormControl variant="outlined" size="small" fullWidth>
              <Select
                value={notify.periodType}
                onChange={(e) =>
                  dispatch({
                    field: `notification:${index}:periodType`,
                    value: e.target.value as string,
                  })
                }
              >
                {periodTypes.map((periodType) => (
                  <MenuItem key={periodType} value={periodType}>
                    {`${periodType}${notify.period === "1" ? "" : "s"} Before`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <IconButton
              onClick={() => {
                dispatch({
                  field: `notification:${index}:remove`,
                });
              }}
            >
              <CloseOutlinedIcon className={classes.closeIcon} />
            </IconButton>
          </Grid>
        </>
      ))}
      <Grid item xs={12}>
        <Button
          className={classes.addReminder}
          onClick={() => {
            dispatch({
              field: `notification:0:add`,
            });
          }}
          disableRipple
        >
          Add Reminder
        </Button>
      </Grid>
      {files ? (
        <>
          <Grid item xs={12}>
            <ChipsInput
              isLineType
              type="files"
              label="Attached File:"
              borderType="square"
              onClick={handleChipClick}
              value={files.map((attachment) => attachment?.name || "") || []}
              icon={<FileIcon width={13} height={13} />}
              onDeleteChip={(index) => setFiles([...files.slice(0, index), ...files.slice(index + 1)])}
            />
            {files ? (
              <PdfPreview
                open={previewOpen}
                setOpen={setPreviewOpen}
                files={files as File[]}
                selectedFileIndex={currentAttachmentIndex}
                setFileIndex={setCurrentAttachmentIndex}
              />
            ) : null}
          </Grid>
        </>
      ) : null}
      <Grid item xs={12}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          label="Note"
          multiline
          rows={5}
          value={eventForm.description}
          onChange={(e: React.FormEvent<HTMLFormElement>) =>
            dispatch({
              field: "description",
              value: e.currentTarget.value,
            })
          }
        />
      </Grid>
    </>
  );
};

export default FormMainPart;
