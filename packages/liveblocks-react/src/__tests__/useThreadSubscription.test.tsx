import type { BaseMetadata, JsonObject } from "@liveblocks/core";
import { createClient } from "@liveblocks/core";
import { renderHook, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { nanoid } from "nanoid";
import React from "react";

import { createRoomContext } from "../room";
import { dummyThreadData, dummyThreadInboxNotificationData } from "./_dummies";
import MockWebSocket from "./_MockWebSocket";
import { mockGetThreads } from "./_restMocks";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  MockWebSocket.reset();
});

afterEach(() => {
  MockWebSocket.reset();
  server.resetHandlers();
});

afterAll(() => server.close());

// TODO: Dry up and create utils that wrap renderHook
function createRoomContextForTest<M extends BaseMetadata>() {
  const client = createClient({
    publicApiKey: "pk_xxx",
    polyfills: {
      WebSocket: MockWebSocket as any,
    },
  });

  return createRoomContext<JsonObject, never, never, never, M>(client);
}

describe("useThreadSubscription", () => {
  test("should return the expected object if the associated inbox notification hasn't been read at all", async () => {
    const roomId = nanoid();
    const threads = [dummyThreadData({ roomId })];
    const inboxNotifications = [
      dummyThreadInboxNotificationData({ roomId, threadId: threads[0].id }),
    ];

    server.use(
      mockGetThreads(async (_req, res, ctx) => {
        return res(
          ctx.json({
            data: threads,
            inboxNotifications,
            deletedThreads: [],
            deletedInboxNotifications: [],
            meta: {
              requestedAt: new Date().toISOString(),
            },
          })
        );
      })
    );

    const { RoomProvider, useThreads, useThreadSubscription } =
      createRoomContextForTest();

    const { result, unmount } = renderHook(
      () => ({
        threads: useThreads(),
        subscription: useThreadSubscription(threads[0].id),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toEqual({ isLoading: true });
    expect(result.current.subscription).toEqual({ status: "not-subscribed" });

    await waitFor(() =>
      expect(result.current.threads).toEqual({
        isLoading: false,
        threads,
      })
    );

    expect(result.current.subscription).toEqual({
      status: "subscribed",
      unreadSince: null,
    });

    unmount();
  });

  test("should return the expected object if the associated inbox notification has been read", async () => {
    const roomId = nanoid();
    const threads = [dummyThreadData({ roomId })];
    const inboxNotifications = [
      dummyThreadInboxNotificationData({
        roomId,
        threadId: threads[0].id,
        readAt: new Date(),
      }),
    ];

    server.use(
      mockGetThreads(async (_req, res, ctx) => {
        return res(
          ctx.json({
            data: threads,
            inboxNotifications,
            deletedThreads: [],
            deletedInboxNotifications: [],
            meta: {
              requestedAt: new Date().toISOString(),
            },
          })
        );
      })
    );

    const { RoomProvider, useThreads, useThreadSubscription } =
      createRoomContextForTest();

    const { result, unmount } = renderHook(
      () => ({
        threads: useThreads(),
        subscription: useThreadSubscription(threads[0].id),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toEqual({ isLoading: true });
    expect(result.current.subscription).toEqual({ status: "not-subscribed" });

    await waitFor(() =>
      expect(result.current.threads).toEqual({
        isLoading: false,
        threads,
      })
    );

    expect(result.current.subscription).toEqual({
      status: "subscribed",
      unreadSince: inboxNotifications[0].readAt,
    });

    unmount();
  });

  test("should return the expected object if the thread doesn't have any inbox notification associated with it", async () => {
    const roomId = nanoid();
    const threads = [dummyThreadData({ roomId })];

    server.use(
      mockGetThreads(async (_req, res, ctx) => {
        return res(
          ctx.json({
            data: threads,
            inboxNotifications: [],
            deletedThreads: [],
            deletedInboxNotifications: [],
            meta: {
              requestedAt: new Date().toISOString(),
            },
          })
        );
      })
    );

    const { RoomProvider, useThreads, useThreadSubscription } =
      createRoomContextForTest();

    const { result, unmount } = renderHook(
      () => ({
        threads: useThreads(),
        subscription: useThreadSubscription(threads[0].id),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toEqual({ isLoading: true });
    expect(result.current.subscription).toEqual({ status: "not-subscribed" });

    await waitFor(() =>
      expect(result.current.threads).toEqual({
        isLoading: false,
        threads,
      })
    );

    expect(result.current.subscription).toEqual({ status: "not-subscribed" });

    unmount();
  });

  test("should be referentially stable", async () => {
    const roomId = nanoid();
    const threads = [dummyThreadData({ roomId })];
    const inboxNotifications = [
      dummyThreadInboxNotificationData({
        roomId,
        threadId: threads[0].id,
      }),
    ];

    server.use(
      mockGetThreads(async (_req, res, ctx) => {
        return res(
          ctx.json({
            data: threads,
            inboxNotifications,
            deletedThreads: [],
            deletedInboxNotifications: [],
            meta: {
              requestedAt: new Date().toISOString(),
            },
          })
        );
      })
    );

    const { RoomProvider, useThreads, useThreadSubscription } =
      createRoomContextForTest();

    const { result, unmount, rerender } = renderHook(
      () => ({
        threads: useThreads(),
        subscription: useThreadSubscription(threads[0].id),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toEqual({ isLoading: true });
    expect(result.current.subscription).toEqual({ status: "not-subscribed" });

    await waitFor(() =>
      expect(result.current.threads).toEqual({
        isLoading: false,
        threads,
      })
    );

    const oldResult = result.current.subscription;

    rerender();

    expect(result.current.subscription).toBe(oldResult);

    unmount();
  });
});
