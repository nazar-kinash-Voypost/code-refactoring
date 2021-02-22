import { messageFragment } from "../common/helpers";
import {
  File,
  Event,
  UpdateEventInput,
  useUpdateEventMutation,
  useCreateEventMutation,
  useDeleteEventMutation,
  Maybe,
  Message,
  useGetSharedAccessQuery,
  User,
  Calendar,
  EventDocument,
  useGetNotificationSettingsByTagLazyQuery,
  EventNotificationInput,
  GetSharedAccessQuery,
} from "../graphql/generated";

import { message, refetchEvents, onEventDelition, setOpen, event } from "./srore";

export const [
  createEventMutation,
  { data: createEventData, loading: createLoading, error: createError },
] = useCreateEventMutation({
  update(cache, { data }) {
    const { createEvent } = data || {};
    if (createEvent) {
      cache.writeQuery({
        query: EventDocument,
        data: {
          event: createEvent,
        },
        variables: { eventId: createEvent.id },
      });
      cache.writeFragment({
        id: "Message:" + message?.id,
        fragment: messageFragment,
        data: {
          event: createEvent,
        },
      });
    }
  },
});

export const [
  updateEventMutation,
  { data: updateEventData, loading: updateLoading, error: updateError },
] = useUpdateEventMutation();

export const [deleteEventMutation] = useDeleteEventMutation({
  onCompleted: async () => {
    if (refetchEvents) {
      refetchEvents();
    }
    if (onEventDelition) {
      await onEventDelition();
    }
    setOpen(false);
  },
  update(cache, { data }) {
    const { deleteEvent } = data || {};
    if (deleteEvent && event) {
      cache.writeQuery({
        query: EventDocument,
        data: {
          event: null,
        },
        variables: { eventId: event.id },
      });
      cache.writeFragment({
        id: "Message:" + message?.id,
        fragment: messageFragment,
        data: {
          event: null,
        },
      });
    }
  },
});
