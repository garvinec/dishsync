import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    name: v.string(),
    code: v.string(),
    dishwasherStatus: v.string(), // "clean" or "dirty"
  }).index("by_code", ["code"]),
  
  userRooms: defineTable({
    userId: v.string(),
    roomId: v.id("rooms"),
    isDefault: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_roomId", ["userId", "roomId"])
    .index("by_userId_and_isDefault", ["userId", "isDefault"]),
});