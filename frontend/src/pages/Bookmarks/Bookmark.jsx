import Post from '@/components/common/Post';
import Posts from '@/components/common/Posts';
import { useQuery } from '@tanstack/react-query';
import React from 'react'

const Bookmark = () => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  console.log(authUser);
  const {
    data: bookmark,
    isBookmarkLoading,
    reBookmarkfetch,
    isrepostRefetching,
  } = useQuery({
    queryKey: ["repostDetails"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/posts/bookmarks/${authUser?._id}`);
        const data = await res.json();
        console.log(data?.bookmarkedPosts);
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });


  return (
    <div className='w-[90%]'>
      <Posts feedType="bookmarks"  userId={authUser?._id} />
    </div>
  )
}

export default Bookmark