import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    content: v.string(),
    likes_count: v.float64(),
    title: v.string(),
    userId: v.id("users"),
    image: v.optional(v.string()),
  }).index("by_user", ["userId"]),
  users: defineTable({
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    liked_posts: v.array(v.id("posts")),
    username: v.string(),
  }).index("by_username", ["username"]),
});
