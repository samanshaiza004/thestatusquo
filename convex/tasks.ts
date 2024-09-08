import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import auth from "./auth";
export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").collect();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .collect();
  },
});

export const postPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { title, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    return await ctx.db.insert("posts", {
      title,
      content,
      userId: user._id,
      likes_count: 0,
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    return user;
  },
});

export const createUser = mutation({
  args: {
    username: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, { username, avatar }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createUser without authentication present");
    }

    // Check if we've already stored this identity before.
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (existingUser) {
      return existingUser._id;
    }

    // If not, create a new user.
    const userId = await ctx.db.insert("users", {
      username,
      avatar,
      tokenIdentifier: identity.tokenIdentifier,
      liked_posts: [],
    });

    return userId;
  },
});

export const signIn = mutation({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, { provider }) => {
    const url = await auth.signIn({
      provider,
    });
    return url;
  },
});
