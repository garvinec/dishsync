import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all rooms for a user
export const getUserRooms = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userRooms = await ctx.db
      .query("userRooms")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const rooms = [];
    for (const userRoom of userRooms) {
      const room = await ctx.db.get(userRoom.roomId);
      if (room) {
        rooms.push({
          _id: room._id,
          name: room.name,
          code: room.code,
          dishwasherStatus: room.dishwasherStatus,
          isDefault: userRoom.isDefault,
        });
      }
    }

    return rooms;
  },
});

// Get a user's default room
export const getDefaultRoom = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userRoom = await ctx.db
      .query("userRooms")
      .withIndex("by_userId_and_isDefault", (q) =>
        q.eq("userId", args.userId).eq("isDefault", true)
      )
      .first();

    if (!userRoom) return null;

    const room = await ctx.db.get(userRoom.roomId);
    if (!room) return null;

    return {
      _id: room._id,
      name: room.name,
      code: room.code,
      dishwasherStatus: room.dishwasherStatus,
      isDefault: true,
    };
  },
});

// Get a room by its code
export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) return null;

    return {
      _id: room._id,
      name: room.name,
      code: room.code,
      dishwasherStatus: room.dishwasherStatus,
    };
  },
});

// Create a new room
export const createRoom = mutation({
  args: {
    name: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      code,
      dishwasherStatus: "dirty", // Default to dirty
    });

    // Check if this is the user's first room
    const existingRooms = await ctx.db
      .query("userRooms")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Add user to room and set as default if it's their first room
    await ctx.db.insert("userRooms", {
      userId: args.userId,
      roomId,
      isDefault: existingRooms.length === 0,
    });

    return { roomId, code };
  },
});

// Join a room using a code
export const joinRoom = mutation({
  args: {
    code: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    // Check if user is already in this room
    const existingUserRoom = await ctx.db
      .query("userRooms")
      .withIndex("by_userId_and_roomId", (q) =>
        q.eq("userId", args.userId).eq("roomId", room._id)
      )
      .first();

    if (existingUserRoom) {
      throw new Error("You're already in this room");
    }

    // Check if this is the user's first room
    const existingRooms = await ctx.db
      .query("userRooms")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Add user to room and set as default if it's their first room
    await ctx.db.insert("userRooms", {
      userId: args.userId,
      roomId: room._id,
      isDefault: existingRooms.length === 0,
    });

    return {
      _id: room._id,
      name: room.name,
      code: room.code,
      dishwasherStatus: room.dishwasherStatus,
    };
  },
});

// Set a room as the default for a user
export const setDefaultRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // First, unset any existing default
    const currentDefault = await ctx.db
      .query("userRooms")
      .withIndex("by_userId_and_isDefault", (q) =>
        q.eq("userId", args.userId).eq("isDefault", true)
      )
      .first();

    if (currentDefault) {
      await ctx.db.patch(currentDefault._id, { isDefault: false });
    }

    // Now set the new default
    const userRoom = await ctx.db
      .query("userRooms")
      .withIndex("by_userId_and_roomId", (q) =>
        q.eq("userId", args.userId).eq("roomId", args.roomId)
      )
      .first();

    if (!userRoom) {
      throw new Error("Room not found for this user");
    }

    await ctx.db.patch(userRoom._id, { isDefault: true });

    return true;
  },
});

// Update dishwasher status
export const updateDishwasherStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    await ctx.db.patch(args.roomId, { dishwasherStatus: args.status });

    return true;
  },
});
