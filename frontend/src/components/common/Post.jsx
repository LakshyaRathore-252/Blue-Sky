import { FaRegComment, FaRegHeart, FaTrash, FaRegBookmark, FaBookmark } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FcLike } from "react-icons/fc";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post, refetch }) => {
	console.log("from post ", post);
	const [comment, setComment] = useState("");
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();
	const postOwner = post?.user;
	const isLiked = Array.isArray(post?.likes) && post?.likes.includes(authUser?._id);
	const isReposted = Array.isArray(post?.reposts) && post?.reposts.includes(authUser?._id);
	const [isBookmarked, setIsBookmarked] = useState(
		post?.bookmarks?.includes(authUser?._id) ? true : false)

	console.log("isbookmarked", isBookmarked);
	const isMyPost = authUser?._id === post?.user?._id;

	const formattedDate = formatPostDate(post?.createdAt);

	// Delete Post Mutation
	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/${post._id}`, {
					method: "DELETE",
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			try {
				if (!post?._id) throw new Error("Post ID is missing");

				const res = await fetch(`/api/posts/like/${post._id}`, { method: "POST" });
				const data = await res.json();

				console.log("Liked post response:", data); // Debugging

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error.message || "Failed to like post");
			}
		},
		onSuccess: (updatedPost) => {
			console.log("Updated post data:", updatedPost); // Debugging

			queryClient.setQueryData(["posts"], (oldData) => {
				if (!Array.isArray(oldData)) return []; // Ensure oldData is an array

				return oldData.map((p) =>
					p._id === post._id ? { ...p, likes: updatedPost.likes } : p
				);
			});

			// Ensure UI updates if cache update fails
			queryClient.invalidateQueries(["posts"]);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});


	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async () => {
			try {
				if (!post?._id) throw new Error("Post ID is missing");
				if (!comment.trim()) throw new Error("Comment cannot be empty");

				const res = await fetch(`/api/posts/comment/${post._id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text: comment }),
				});

				const data = await res.json();
				console.log("Comment response:", data); // Debugging

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error.message || "Failed to post comment");
			}
		},
		onSuccess: (updatedPost) => {
			console.log("Updated post after comment:", updatedPost); // Debugging

			queryClient.setQueryData(["posts"], (oldData) => {
				if (!Array.isArray(oldData)) return []; // Ensure oldData is an array

				return oldData.map((p) =>
					p._id === post._id ? { ...p, comments: updatedPost.comments } : p
				);
			});

			toast.success("Comment posted successfully");
			setComment("");

			// Ensure UI updates if cache update fails
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});


	// Repost Post Mutation
	const { mutate: repostPost, isPending: isReposting } = useMutation({
		mutationFn: async () => {
			try {
				if (!post?._id) throw new Error("Post ID is missing");

				const res = await fetch(`/api/posts/${post._id}/repost`, {
					method: "POST",
				});

				const data = await res.json();
				console.log("Repost response:", data); // Debugging

				if (!res.ok) {
					throw new Error(data?.message || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error.message || "Failed to repost");
			}
		},
		onSuccess: (updatedPost) => {
			console.log("Updated post after repost:", updatedPost); // Debugging

			queryClient.setQueryData(["posts"], (oldData) => {
				if (!Array.isArray(oldData)) return []; // Ensure oldData is an array

				return oldData.map((p) =>
					p._id === post._id ? { ...p, reposts: updatedPost.reposts } : p
				);
			});

			toast.success("Post reposted successfully");

			// Ensure UI updates if cache update fails
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Bookmark Mutation
	const { mutate: bookmarkPost, isPending: isBookmarking } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/bookmark/${post._id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ postId: post._id }),
				});
				const data = await res.json();
				console.log("Bookmarked post:", data?.bookmarks);


				// Use a callback to ensure the latest state
				setIsBookmarked((prev) => data?.bookmarks?.includes(authUser?._id) ? true : false);
				if (res.ok && data?.bookmarks?.length === 0) {

					refetch()
				}
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["posts"], (oldData) => {
				return (oldData || []).map((p) => {
					if (p._id === post._id) {
						return { ...p, bookmarks: data.bookmarks };
					}
					return p;
				});
			});
			toast.success(data.message || "Post bookmarked successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Handlers
	const handleDeletePost = () => {
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if (isCommenting) return;
		commentPost();
	};

	const handleLikePost = () => {
		if (isLiking) return;
		likePost();
	};

	const handleRepostPost = () => {
		if (isReposting) return;
		repostPost();
	};

	const handleBookmarkPost = () => {
		if (isBookmarking) return;
		bookmarkPost();
	};

	return (
		<div className='flex gap-2 items-start p-4 border-b border-gray-700'>

			<div className='avatar'>
				<Link to={`/profile/${postOwner?.username}`} className='w-8 rounded-full overflow-hidden'>
					<img src={postOwner?.profileImg || "/avatar-placeholder.png"} alt="Profile" />
				</Link>
			</div>
			<div className='flex flex-col flex-1'>
				<div className='flex gap-2 items-center'>
					<Link to={`/profile/${postOwner?.username}`} className='font-bold'>
						{postOwner?.fullName}
					</Link>
					<span className='text-[#fff] flex gap-1 text-sm'>
						<Link to={`/profile/${postOwner?.username}`}>@{postOwner?.username}</Link>
						<span>·</span>
						<span>{formattedDate}</span>
					</span>
					{isMyPost && (
						<span className='flex justify-end flex-1'>
							{!isDeleting && (
								<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
							)}
							{isDeleting && <LoadingSpinner size='sm' />}
						</span>
					)}
				</div>
				<div className='flex flex-col gap-3 overflow-hidden'>
					<span>{post?.text}</span>
					{post?.img && (
						<img
							src={post?.img}
							className='h-80 object-contain rounded-lg border border-gray-700'
							alt='Post'
						/>
					)}
				</div>
				<div className='flex justify-between mt-3'>
					<div className='flex gap-4 items-center w-2/3 justify-between'>
						<div
							className='flex gap-1 items-center cursor-pointer group'
							onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
						>
							<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
							<span className='text-sm text-slate-500 group-hover:text-sky-400'>
								{post?.comments?.length}
							</span>
						</div>
						<dialog id={`comments_modal${post?._id}`} className='modal border-none outline-none'>
							<div className='modal-box rounded border border-gray-600 bg-[#1E2936]'>
								<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
								<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
									{post?.comments?.length === 0 && (
										<p className='text-sm text-slate-500'>
											No comments yet 🤔 Be the first one 😉
										</p>
									)}
									{post?.comments?.map((comment) => (
										<div key={comment?._id} className='flex gap-2 items-start  '>
											<div className='avatar'>
												<div className='w-8 rounded-full'>
													<img
														src={comment?.user?.profileImg || "/avatar-placeholder.png"}
														alt="Commenter Profile"
													/>
												</div>
											</div>
											<div className='flex flex-col'>
												<div className='flex items-center gap-1'>
													<span className='font-bold'>{comment?.user?.fullName}</span>
													<span className='text-[#fff] text-sm'>
														@{comment?.user?.username}
													</span>
												</div>
												<div className='text-sm'>{comment?.text}</div>
											</div>
										</div>
									))}
								</div>
								<form
									className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
									onSubmit={handlePostComment}
								>
									<textarea
										className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none bg-[#1E2936] border-white'
										placeholder='Add a comment...'
										value={comment}
										onChange={(e) => setComment(e.target.value)}
									/>
									<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
										{isCommenting ? <LoadingSpinner size='md' /> : "Post"}
									</button>
								</form>
							</div>
							<form method='dialog' className='modal-backdrop'>
								<button className='outline-none'>close</button>
							</form>
						</dialog>
						<div
							className='flex gap-1 items-center group cursor-pointer'
							onClick={handleRepostPost}
						>
							{isReposting && <LoadingSpinner size='sm' />}
							{!isReposted && !isReposting && (
								<BiRepost className='w-6 h-6  text-slate-500 group-hover:text-green-500' />
							)}
							{isReposted && !isReposting && (
								<BiRepost className='w-6 h-6  text-green-500' />
							)}
							<span
								className={`text-sm  group-hover:text-green-500 ${isReposted ? "text-green-500" : "text-slate-500"
									}`}
							>
								{post?.reposts?.length}
							</span>
						</div>
						<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
							{isLiking && <LoadingSpinner size='sm' />}
							{!isLiked && !isLiking && (
								<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
							)}
							{isLiked && !isLiking && (
								<FcLike className='w-4 h-4 cursor-pointer text-pink-500 ' />
							)}

							<span
								className={`text-sm  group-hover:text-pink-500 ${isLiked ? "text-pink-500" : "text-slate-500"
									}`}
							>
								{post?.likes?.length}
							</span>
						</div>
					</div>
					<div className='flex w-1/3 justify-end gap-2 items-center'>
						{isBookmarking ? (
							<LoadingSpinner size='sm' />
						) : (
							<div
								className='flex gap-1 items-center group cursor-pointer'
								onClick={handleBookmarkPost}
							>
								{isBookmarked ? (
									<FaBookmark className="w-4 h-4 text-blue-500" />
								) : (
									<FaRegBookmark className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
								)}

								<span
									className={`text-sm group-hover:text-blue-500 ${post?.bookmarks?.includes(authUser?._id) ? "text-blue-500" : "text-slate-500"
										}`}
								>
									{post?.bookmarks?.length}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Post;