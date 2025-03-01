import { wait } from "@liveblocks/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { nanoid } from "nanoid";
import React from "react";

import { dummyCommentData, dummyThreadData } from "./_dummies";
import MockWebSocket from "./_MockWebSocket";
import { mockDeleteThread, mockGetThreads } from "./_restMocks";
import { createRoomContextForTest } from "./_utils";

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

function createDummyThreads(roomId: string, userId: string) {
  return [
    dummyThreadData({
      roomId,
      comments: [
        dummyCommentData({
          roomId,
          userId,
        }),
      ],
    }),
  ];
}

describe("useDeleteThread", () => {
  const userId = "batman";

  test("should delete a thread optimistically", async () => {
    const roomId = nanoid();
    const threads = createDummyThreads(roomId, userId);

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
      }),
      mockDeleteThread({ threadId: threads[0].id }, async (_req, res, ctx) => {
        return res(ctx.status(204));
      })
    );

    const { RoomProvider, useThreads, useDeleteThread } =
      createRoomContextForTest({ userId });

    const { result, unmount } = renderHook(
      () => ({
        threads: useThreads().threads,
        deleteThread: useDeleteThread(),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toBeUndefined();

    await waitFor(() => expect(result.current.threads).toEqual(threads));

    act(() => {
      result.current.deleteThread(threads[0].id);
    });

    await waitFor(() => expect(result.current.threads).toEqual([]));

    // TODO: We should wait for the `deleteThread` call to be finished but we don't have APIs for that yet
    //       We should expose a way to know (and be updated about) if there are still pending optimistic updates
    //       Until then, we'll just wait a bit to make sure the request doesn't leak into the next tests
    await wait(1000);

    unmount();
  });

  test("should throw an error when a user attempts to delete someone else's thread", async () => {
    const roomId = nanoid();
    const threads = createDummyThreads(roomId, userId);

    server.use(
      mockGetThreads(async (_req, res, ctx) =>
        res(
          ctx.json({
            data: threads,
            inboxNotifications: [],
            deletedThreads: [],
            deletedInboxNotifications: [],
            meta: {
              requestedAt: new Date().toISOString(),
            },
          })
        )
      )
      // No need to mock delete thread, as it should not be called
    );

    // In this test, the current user's ID is "not-the-thread-creator"
    const { RoomProvider, useThreads, useDeleteThread, useRoom } =
      createRoomContextForTest({
        userId: "not-the-thread-creator",
      });

    const { result, unmount } = renderHook(
      () => ({
        threads: useThreads().threads,
        deleteThread: useDeleteThread(),
        room: useRoom(),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toBeUndefined();

    await waitFor(() => expect(result.current.threads).toEqual(threads));

    expect(result.current.room.getSelf()?.id).toEqual("not-the-thread-creator");

    let errorMessage: string | undefined;

    act(() => {
      try {
        result.current.deleteThread(threads[0].id);
      } catch (error) {
        errorMessage = (error as Error).message;
      }
    });

    expect(errorMessage).toMatch(
      "Only the thread creator can delete the thread"
    );

    await waitFor(() => expect(result.current.threads).toEqual(threads));

    unmount();
  });

  test("should rollback optimistic deletion if server fails", async () => {
    const roomId = nanoid();
    const threads = createDummyThreads(roomId, userId);

    server.use(
      mockGetThreads(async (_req, res, ctx) =>
        res(
          ctx.json({
            data: threads,
            inboxNotifications: [],
            deletedThreads: [],
            deletedInboxNotifications: [],
            meta: {
              requestedAt: new Date().toISOString(),
            },
          })
        )
      ),
      mockDeleteThread({ threadId: threads[0].id }, async (_req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const { RoomProvider, useThreads, useDeleteThread } =
      createRoomContextForTest({ userId });

    const { result, unmount } = renderHook(
      () => ({
        threads: useThreads().threads,
        deleteThread: useDeleteThread(),
      }),
      {
        wrapper: ({ children }) => (
          <RoomProvider id={roomId}>{children}</RoomProvider>
        ),
      }
    );

    expect(result.current.threads).toBeUndefined();

    await waitFor(() => expect(result.current.threads).toEqual(threads));

    act(() => {
      result.current.deleteThread(threads[0].id);
    });

    expect(result.current.threads).toEqual([]);

    await waitFor(() => expect(result.current.threads).toEqual(threads));

    unmount();
  });
});
