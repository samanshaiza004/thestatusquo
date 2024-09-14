import { Html } from "@elysiajs/html";
import { client } from "..";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

const PostForm = async ({ cookie }: { cookie: any }) => {
  const userId = cookie.userId.value as Id<"users"> | undefined;
  const user = userId
    ? await client.query(api.tasks.getCurrentUser, { userId })
    : null;

  if (!user) {
    return (
      <div>
        <p>Please log in to create a post.</p>
        <a href="/login" class="text-blue-400 hover:underline">
          Log in
        </a>
      </div>
    );
  }
  return (
    <div class="md:w-10/12 sm:w-full">
      <form
        hx-post="/post"
        hx-target="#posts"
        hx-swap="innerHTML"
        hx-on--after-request="this.reset()"
        class="space-y-2"
      >
        <input
          type="text"
          name="title"
          placeholder="Title"
          required
          class="w-full p-2 border text-sm sm:text-base"
        />
        <textarea
          name="content"
          placeholder="Content"
          required
          class="w-full p-2 border text-sm sm:text-base"
        ></textarea>
        <button
          type="submit"
          class="w-full bg-blue-400 text-white p-2 hover:bg-blue-500 text-sm sm:text-base"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default PostForm;
