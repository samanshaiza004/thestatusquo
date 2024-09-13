// convex/tasks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .order("desc")
      .collect();
  },
});


export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    return user;
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
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    return user;
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");
    return user;
  },
});

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");
    return post;
  },
});

export const deletePostById = mutation({
  args: { postId: v.id("posts"), userId: v.id("users") },
  handler: async (ctx, { postId, userId }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    if (post.userId !== userId) {
      throw new Error("You are not authorized to delete this post");
    }

    await ctx.db.delete(postId);

    return { success: true, message: "Post deleted successfully" };

  },
});

export const modifyLikeToPost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, { postId, userId }) => {
    try {
      const post = await ctx.db.get(postId);
      if (!post) throw new Error("Post not found");
  
      const user = await ctx.db.get(userId);
      if (!user) throw new Error("User not found");
  
      let likedPosts = user.liked_posts || [];
      let likesCount = post.likes_count || 0;
      let action = "";
  
      if (likedPosts.includes(postId)) {
  
        likedPosts = likedPosts.filter((id) => id !== postId);
        likesCount = Math.max(0, likesCount - 1);
        action = "unliked";
      } else {
  
        likedPosts.push(postId);
        likesCount += 1;
        action = "liked";
      }
  
      await ctx.db.patch(userId, { liked_posts: likedPosts });
  
      await ctx.db.patch(postId, { likes_count: likesCount });
  
      console.log(`Post ${action} by user`);
  
      const updatedPost = await ctx.db.get(postId);
      return updatedPost;
    } catch (err) {
      console.error(err);
    }
    
  },
});
