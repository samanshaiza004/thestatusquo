// convex/tasks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    userId: v.id("users"),
  },
  handler: async (ctx, { title, content, userId }) => {
    const user = await ctx.db.get(userId);
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
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const createUser = mutation({
  args: {
    username: v.string(),
    avatar: v.optional(v.string()),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, { username, avatar, tokenIdentifier }) => {
    // Check if we've already stored this identity before.
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
    if (existingUser) {
      // If the user exists, update their information
      await ctx.db.patch(existingUser._id, { username, avatar });
      return existingUser._id;
    }

    // If not, create a new user.
    const userId = await ctx.db.insert("users", {
      username,
      avatar,
      tokenIdentifier,
      liked_posts: [],
    });

    return userId;
  },
});

export const getUserByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
  },
});

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("_id"), postId));
  },
});

export const deletePostById = mutation({
  args: { postId: v.id("posts"), userId: v.id("users") },
  handler: async (ctx, { postId, userId }) => {
    const post = await ctx.db.get(postId); // Ensure to await the post retrieval
    if (!post) throw new Error("No post with _id " + postId + " exists");
    // Assuming you have access to the current user's ID in the context
    if (post.userId !== userId) {
      throw new Error("You are not authorized to delete this post");
    }

    await ctx.db.delete(postId);

    return "Post deleted successfully";
  },
});
