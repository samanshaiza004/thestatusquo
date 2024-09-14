import { Html } from "@elysiajs/html";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { client } from "..";

import Post from "./Post";

const PostsDisplay = async ({ cookie }: { cookie: any }) => {
  const userId = cookie.userId.value as Id<"users"> | undefined;
  const user = userId
    ? await client.query(api.tasks.getCurrentUser, { userId })
    : null;

  try {
    const posts = await client.query(api.tasks.getPosts);

    const postsWithUsers = await Promise.all(
      posts.map(async (post: any) => {
        try {
          const postUser = await client.query(api.tasks.getUserById, {
            userId: post.userId,
          });
          return { ...post, user: postUser }; // Assuming postUser is an array
        } catch (error) {
          console.error(`Failed to fetch user for post ${post._id}:`, error);
          return { ...post, user: null };
        }
      })
    );

    return (
      <div class="overflow-y-auto w-10/12 h-full">
        {postsWithUsers.map((post: any) => (
          <Post key={post._id} post={post} user={user} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return <div>Error loading posts. Please try again later.</div>;
  }
};

export default PostsDisplay;
