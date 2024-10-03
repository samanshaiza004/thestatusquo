import { Html } from "@elysiajs/html";

const UserProfilePage = ({
  currentUser,
  user,
}: {
  currentUser: any;
  user: any;
}) => {
  return (
    <div class="border rounded-lg p-4 mb-4 bg-white shadow-sm max-w-2xl mx-auto">
      <div class="flex justify-between items-start flex-wrap sm:flex-nowrap">
        <div class="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={`${user.username}'s avatar`}
            class="w-16 h-16 rounded-full object-cover border"
          />
          <div>
            <h3 class="text-xl font-bold text-gray-800">{user.username}</h3>
            <span class="text-sm text-gray-500">followers: {12}</span>
          </div>
        </div>

        <div class="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-3">
          <button class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition">
            {currentUser.isFollowing ? "Unfollow" : "Follow"}
          </button>
        </div>
      </div>

      <div class="mt-4">
        <p class="text-sm text-gray-700">
          {user.bio ? user.bio : "This user has no bio yet."}
        </p>
      </div>
    </div>
  );
};

export default UserProfilePage;
