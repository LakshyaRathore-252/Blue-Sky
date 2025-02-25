import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const Posts = ({ feedType, username, userId }) => {
	const getPostEndpoint = () => {
		switch (feedType) {
			case "forYou":
				return "/api/posts/all";
			case "following":
				return "/api/posts/following";
			case "posts":
				return `/api/posts/user/${username}`;
			case "likes":
				return `/api/posts/likes/${userId}`;
			case "bookmarks":
				return `/api/posts/bookmarks/${userId}`;
			case "reposts":
				return `/api/posts/getAllReposts/${userId}`;
			default:
				return "/api/posts/all";
		}
	};

	const POST_ENDPOINT = getPostEndpoint();

	const {
		data,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery({
		queryKey: ["posts", feedType, username, userId], // Ensure cache updates properly
		queryFn: async () => {
			try {
				const res = await fetch(POST_ENDPOINT);
				const result = await res.json();
				console.log("Fetched data:", result);

				if (!res.ok) {
					throw new Error(result?.error || "Something went wrong");
				}

				// Ensure response is an array
				return Array.isArray(result) ? result : [];
			} catch (error) {
				console.error("Error fetching posts:", error);
				return []; // Return an empty array on failure
			}
		},
	});

	useEffect(() => {
		refetch();
	}, [feedType, username, userId, refetch]);

	const posts = data ?? []; // Ensure posts is always an array

	console.log(data);
	return (
		<>
			{(isLoading || isRefetching) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isLoading && !isRefetching && posts.length === 0 && (
				<p className='text-center my-4'>No posts in this tab. Switch 👻</p>
			)}
			{!isLoading && !isRefetching && posts.length > 0 && (
				<div>
					{posts.map((post) => (
						<Post key={post?._id} post={post} refetch={refetch} />
					))}
				</div>
			)}
		</>
	);
};

export default Posts;
