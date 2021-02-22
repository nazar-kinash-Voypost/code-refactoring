import React from "react";
import { Dialog, DialogTitle, DialogContent, Grid, IconButton } from "@material-ui/core";
import Form from "../Form/Form";
import { useStyles } from "../../stylesComponrnts";
import { CloseOutlined as CloseOutlinedIcon } from "@material-ui/icons";

const DialogComponent = ({
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
  open,
}) => {
  const classes = useStyles();

  const handleDialogClose = () => {
    setOpen(false);
    if (onDialogClose) {
      onDialogClose();
    }
  };

  return (
    <Dialog
      classes={{
        paper: classes.modal,
      }}
      open={open}
      onClose={handleDialogClose}
    >
      <DialogTitle className={classes.modalTitle}>
        <Grid container justify="space-between" alignItems="center">
          <Grid item>{message ? "Create new event" : "Event Details"}</Grid>
          <Grid item>
            <IconButton
              classes={{
                root: classes.iconButtonRoot,
              }}
              onClick={() => setOpen(false)}
            >
              <CloseOutlinedIcon />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Form
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
      </DialogContent>
    </Dialog>
  );
};

export default DialogComponent;
