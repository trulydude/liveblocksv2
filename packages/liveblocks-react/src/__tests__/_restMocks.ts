import type {
  BaseMetadata,
  CommentData,
  InboxNotificationData,
  RoomNotificationSettings,
  ThreadData,
} from "@liveblocks/core";
import type { ResponseResolver, RestContext, RestRequest } from "msw";
import { rest } from "msw";

export function mockGetThreads(
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    {
      data: ThreadData<any>[];
      inboxNotifications: InboxNotificationData[];
    }
  >
) {
  return rest.get(
    "https://api.liveblocks.io/v2/c/rooms/:roomId/threads",
    resolver
  );
}

export function mockGetThread(
  params: { threadId: string },
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    {
      thread: ThreadData<any>;
      inboxNotification?: InboxNotificationData;
    }
  >
) {
  return rest.get(
    `https://api.liveblocks.io/v2/c/rooms/:roomId/thread-with-notification/${params.threadId}`,
    resolver
  );
}

export function mockCreateThread(
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    ThreadData<any>
  >
) {
  return rest.post(
    "https://api.liveblocks.io/v2/c/rooms/:roomId/threads",
    resolver
  );
}

export function mockDeleteThread(
  params: { threadId: string },
  resolver: ResponseResolver<RestRequest<never, never>, RestContext, any>
) {
  return rest.delete(
    `https://api.liveblocks.io/v2/c/rooms/:roomId/threads/${params.threadId}`,
    resolver
  );
}

export function mockCreateComment(
  params: { threadId: string },
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    CommentData
  >
) {
  return rest.post(
    `https://api.liveblocks.io/v2/c/rooms/:roomId/threads/${params.threadId}/comments`,
    resolver
  );
}

export function mockEditThreadMetadata<M extends BaseMetadata>(
  params: { threadId: string },
  resolver: ResponseResolver<RestRequest<never, never>, RestContext, M>
) {
  return rest.post(
    `https://api.liveblocks.io/v2/c/rooms/:roomId/threads/${params.threadId}/metadata`,
    resolver
  );
}

export function mockMarkThreadAsResolved(
  params: { threadId: string },
  resolver: ResponseResolver<RestRequest<never, never>, RestContext>
) {
  return rest.post(
    `https://api.liveblocks.io/v2/c/rooms/:roomId/threads/${params.threadId}/mark-as-resolved`,
    resolver
  );
}

export function mockMarkThreadAsUnresolved(
  params: { threadId: string },
  resolver: ResponseResolver<RestRequest<never, never>, RestContext>
) {
  return rest.post(
    `https://api.liveblocks.io/v2/c/rooms/:roomId/threads/${params.threadId}/mark-as-unresolved`,
    resolver
  );
}

export function mockMarkInboxNotificationsAsRead(
  resolver: ResponseResolver<RestRequest<never, never>, RestContext, any>
) {
  return rest.post(
    "https://api.liveblocks.io/v2/c/rooms/:roomId/inbox-notifications/read",
    resolver
  );
}

export function mockGetInboxNotifications(
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    {
      threads: ThreadData<any>[];
      inboxNotifications: InboxNotificationData[];
    }
  >
) {
  return rest.get(
    "https://api.liveblocks.io/v2/c/inbox-notifications",
    resolver
  );
}

export function mockGetRoomNotificationSettings(
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    RoomNotificationSettings
  >
) {
  return rest.get(
    "https://api.liveblocks.io/v2/c/rooms/:roomId/notification-settings",
    resolver
  );
}

export function mockUpdateRoomNotificationSettings(
  resolver: ResponseResolver<
    RestRequest<never, never>,
    RestContext,
    RoomNotificationSettings
  >
) {
  return rest.post(
    "https://api.liveblocks.io/v2/c/rooms/:roomId/notification-settings",
    resolver
  );
}
