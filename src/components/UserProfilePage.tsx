import { Html } from "@elysiajs/html";

const UserProfilePage = ({
  currentUser,
  user,
}: {
  currentUser: any;
  user: any;
}) => {
  return (
    <div class="border p-2 mb-2 bg-white">
      <div class="flex justify-between flex-wrap">
        <div class="flex sm:flex-row gap-2">
          <img src={user.avatar} />
          <h3 class="text-lg sm:text-xl font-bold">{user.username}</h3>
        </div>

        <div class="flex flex-col items-center gap-1">
          <span class="text-sm sm:text-base">followers: {12}</span>
          <button class="text-sm sm:text-base">follow?</button>
        </div>
        <div class="flex gap-2 mt-2 sm:mt-0">
          {user.bio ? <span>{user.bio}</span> : <span>no bio...</span>}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
