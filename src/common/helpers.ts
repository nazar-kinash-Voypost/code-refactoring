import { gql } from "@apollo/client";
import { useReducer } from "react";
import moment from "moment";

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
import { reducer } from "./reducer";
import { message, event } from "./srore";

export const periodTypes = ["Minute", "Hour", "Day", "Week"];
export const periodRate = {
  Minute: 1000 * 60,
  Hour: 1000 * 60 * 60,
  Day: 1000 * 60 * 60 * 24,
  Week: 1000 * 60 * 60 * 24 * 7,
};

export const createLink = (
  userEmail: string,
  messageId: string | null | undefined,
  isDone: boolean | null | undefined,
  isDeleted: boolean | null | undefined
): string => {
  if (isDone) {
    return `/messages/done/${messageId}`;
  } else if (isDeleted) {
    return `/messages/deleted/${messageId}`;
  } else {
    return `/inbox/${userEmail}/${messageId}`;
  }
};

export const messageFragment = gql`
  fragment MyMessage on Message {
    id
    event {
      id #id should be for correct render
    }
  }
`;

export const [getNotificationSettings, { data: notificationSettingsData }] = useGetNotificationSettingsByTagLazyQuery();

const now = moment();
const oneHourFuture = moment(now).add(1, "hours");
const nowDateEndDate = Number(moment(now).format("HH")) >= 23 ? moment(now).add(1, "day") : now;
const initialEventForm: any = {
  ...message?.eventPreview,
  ...message?.eventInfo,
  ...event,
  startDate: moment(event?.startTime || message?.eventInfo?.startTime || now).format("l"),
  startTime: moment(event?.startTime || message?.eventInfo?.startTime || now).format("HH:mm"),
  endTime: moment(event?.endTime || message?.eventInfo?.endTime || oneHourFuture).format("HH:mm"),
  endDate: moment(event?.endTime || message?.eventInfo?.startTime || nowDateEndDate).format("l"),
};

export const [eventForm, dispatch] = useReducer(reducer, initialEventForm);
