import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const PostsDisplay = async () => {
  try {
    const posts = await client.query(api.tasks.getPosts);
    const postsWithUsers = await Promise.all(
      posts.map(async (post: any) => {
        try {
          const user = await client.query(api.tasks.getUserById, {
            userId: post.userId,
          });
          return { ...post, user };
        } catch (error) {
          console.error(`Failed to fetch user for post ${post._id}:`, error);
          return { ...post, user: null };
        }
      })
    );
    return (
      <div>
        {postsWithUsers.map((post: any) => (
          <Post key={post._id} post={post} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return <div>Error loading posts. Please try again later.</div>;
  }
};

const Post = ({ post }: { post: any }) => {
  return (
    <div class="border p-4 mb-4 rounded-lg">
      <div class="flex justify-between">
        <h3 class="text-xl font-bold">{post.title}</h3>
        <span>{timeSince(new Date(post._creationTime))} ago</span>
      </div>
      <p>{post.content}</p>
      <p>Likes: {post.likes_count}</p>
      {post.user ? (
        <p>Author: {post.user[0].username || "Unknown"}</p>
      ) : (
        <p>Author: Unable to load</p>
      )}
    </div>
  );
};

const PostForm = () => {
  return (
    <form hx-post="/post" hx-target="#posts" hx-swap="outerHTML">
      <input type="text" name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required></textarea>
      <button type="submit">Submit</button>
    </form>
  );
};

const app = new Elysia()
  .use(html())
  .get("/", async () => (
    <html lang="en">
      <head>
        <title>The Status Quo</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          src="https://unpkg.com/htmx.org@2.0.2"
          integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
          crossorigin="anonymous"
        ></script>
      </head>
      <body class="p-4">
        <h1 class="text-3xl font-bold mb-4">The Status Quo</h1>
        <div>
          <div id="posts">
            <h2 class="text-2xl font-semibold mb-2">Posts</h2>
            {await PostsDisplay()}
          </div>
          <div class="">
            <PostForm />
          </div>
        </div>
      </body>
    </html>
  ))
  .post("/post", async ({ body }) => {
    try {
      const { title, content } = body as { title: string; content: string };
      // Assuming you have a userId available. You might need to implement user authentication.
      const userId = "j571kqvfm76cqgjty0f1ap4p1h70a2qc" as Id<"users">;
      await client.mutation(api.tasks.postPost, {
        title,
        content,
        userId: userId,
      });
      return await PostsDisplay();
    } catch (error) {
      console.error("Error creating post:", error);
      return <div>Error creating post. Please try again.</div>;
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

function timeSince(date: Date) {
  let seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;

  if (interval > 2) {
    return Math.floor(interval) + " years";
  } else if (interval > 1) {
    return Math.floor(interval) + " year";
  }
  interval = seconds / 2592000;
  if (interval > 2) {
    return Math.floor(interval) + " months";
  } else if (interval > 1) {
    return Math.floor(interval) + " month";
  }
  interval = seconds / 86400;
  if (interval > 2) {
    return Math.floor(interval) + " days";
  } else if (interval > 1) {
    return Math.floor(interval) + " day";
  }
  interval = seconds / 3600;
  if (interval > 2) {
    return Math.floor(interval) + " hours";
  } else if (interval > 1) {
    return Math.floor(interval) + " hour";
  }
  interval = seconds / 60;
  if (interval > 2) {
    return Math.floor(interval) + " minutes";
  } else if (interval > 1) {
    return Math.floor(interval) + " minute";
  }
  return Math.floor(seconds) + " seconds";
}
