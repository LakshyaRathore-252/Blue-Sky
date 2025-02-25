import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";
import { formatMemberSinceDate } from "../../utils/date";
import useFollow from "../../hooks/useFollow";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";
import Post from "@/components/common/Post";

const ProfilePage = () => {
	const [coverImg, setCoverImg] = useState(null);
	const [profileImg, setProfileImg] = useState(null);
	const [feedType, setFeedType] = useState("posts");

	const coverImgRef = useRef(null);
	const profileImgRef = useRef(null);

	const { username } = useParams();

	const { follow, isPending } = useFollow();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const fetchUserProfile = async () => {
		const res = await fetch(`/api/users/profile/${username}`);
		if (!res.ok) {
			throw new Error("Failed to fetch user profile");
		}
		return res.json();
	};

	const fetchReposts = async () => {
		const res = await fetch(`/api/posts/getAllReposts/${authUser._id}`);
		const data = await res.json();
		console.log("repost posts ", data);
		if (!res.ok) {
			throw new Error("Failed to fetch reposts");
		}
		return data;
	};

	const {
		data: user,
		isLoading,
		error: userError,
		refetch,
	} = useQuery({
		queryKey: ["userProfile", username],
		queryFn: fetchUserProfile,
	});

	const {
		data: repost,
		isLoading: isRepostLoading,
		error: repostError,
	} = useQuery({
		queryKey: ["repostDetails"],
		queryFn: fetchReposts,
	});

	const { isUpdatingProfile, updateProfile } = useUpdateUserProfile();

	const isMyProfile = authUser?._id === user?._id;
	const memberSinceDate = formatMemberSinceDate(user?.createdAt);
	const amIFollowing = authUser?.following.includes(user?._id);

	const handleImgChange = (e, state) => {
		const file = e.target.files[0];
		if (file && file.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onload = () => {
				state === "coverImg" ? setCoverImg(reader.result) : setProfileImg(reader.result);
			};
			reader.readAsDataURL(file);
		} else {
			alert("Please upload a valid image file");
		}
	};

	useEffect(() => {
		refetch();
	}, [username, refetch]);

	if (userError) return <p className='text-center text-lg mt-4'>Error loading user profile: {userError.message}</p>;
	if (repostError) return <p className='text-center text-lg mt-4'>Error loading reposts: {repostError.message}</p>;

	return (
		<div className='flex-[4_4_0] border-r border-gray-700 min-h-screen'>
			{(isLoading || isRepostLoading) && <ProfileHeaderSkeleton />}
			{!isLoading && !user && <p className='text-center text-lg mt-4'>User not found</p>}
			{user && (
				<>
					<div className='flex gap-10 px-4 py-2 items-center'>
						<Link to='/' aria-label='Go back'>
							<FaArrowLeft className='w-4 h-4' />
						</Link>
						<div className='flex flex-col'>
							<p className='font-bold text-lg'>{user.fullName}</p>
							<span className='text-sm text-slate-500'>{user.posts?.length} posts</span>
						</div>
					</div>
					<div className='relative group/cover'>
						<img
							src={coverImg || user.coverImg || "/cover.png"}
							className='h-52 w-full object-cover'
							alt='Cover'
						/>
						{isMyProfile && (
							<button
								className='absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200'
								onClick={() => coverImgRef.current.click()}
								aria-label='Edit cover image'
							>
								<MdEdit className='w-5 h-5 text-white' />
							</button>
						)}
						<input
							type='file'
							hidden
							accept='image/*'
							ref={coverImgRef}
							onChange={(e) => handleImgChange(e, "coverImg")}
						/>
						<input
							type='file'
							hidden
							accept='image/*'
							ref={profileImgRef}
							onChange={(e) => handleImgChange(e, "profileImg")}
						/>
						<div className='avatar absolute -bottom-16 left-4'>
							<div className='w-32 rounded-full relative group/avatar'>
								<img
									src={profileImg || user.profileImg || "/avatar-placeholder.png"}
									alt='Profile'
								/>
								{isMyProfile && (
									<button
										className='absolute top-5 right-3 p-1 bg-primary rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer'
										onClick={() => profileImgRef.current.click()}
										aria-label='Edit profile image'
									>
										<MdEdit className='w-4 h-4 text-white' />
									</button>
								)}
							</div>
						</div>
					</div>
					<div className='flex justify-end px-4 mt-5'>
						{isMyProfile && <EditProfileModal authUser={authUser} />}
						{!isMyProfile && (
							<button
								className='btn btn-outline rounded-full btn-sm'
								onClick={() => follow(user._id)}
								disabled={isPending}
							>
								{isPending ? "Loading..." : amIFollowing ? "Unfollow" : "Follow"}
							</button>
						)}
						{(coverImg || profileImg) && (
							<button
								className='btn btn-primary rounded-full btn-sm text-white px-4 ml-2'
								onClick={async () => {
									await updateProfile({ coverImg, profileImg });
									setProfileImg(null);
									setCoverImg(null);
								}}
								disabled={isUpdatingProfile}
							>
								{isUpdatingProfile ? "Updating..." : "Update"}
							</button>
						)}
					</div>
					<div className='flex flex-col gap-4 mt-14 px-4'>
						<div className='flex flex-col'>
							<span className='font-bold text-lg'>{user.fullName}</span>
							<span className='text-sm text-[#fff]'>@{user.username}</span>
							<span className='text-sm my-1'>{user.bio}</span>
						</div>
						<div className='flex gap-2 flex-wrap'>
							{user.link && (
								<div className='flex gap-1 items-center'>
									<FaLink className='w-3 h-3 text-slate-500' />
									<a
										href={user.link}
										target='_blank'
										rel='noreferrer'
										className='text-sm text-blue-500 hover:underline'
									>
										{user.link}
									</a>
								</div>
							)}
							<div className='flex gap-2 items-center text-[#fff]'>
								<IoCalendarOutline className='w-4 h-4 ' />
								<span className='text-sm '>{memberSinceDate}</span>
							</div>
						</div>
						<div className='flex gap-2'>
							<div className='flex gap-1 items-center'>
								<span className='font-bold text-xs'>{user.following.length}</span>
								<span className='text-[#fff] text-xs'>Following</span>
							</div>
							<div className='flex gap-1 items-center'>
								<span className='font-bold text-xs'>{user.followers.length}</span>
								<span className='text-[#fff] text-xs'>Followers</span>
							</div>
						</div>
					</div>
					<div className='flex w-full border-b border-gray-700 mt-4'>
						<button
							className={`flex justify-center flex-1 p-3 ${feedType === "posts" ? "" : "text-slate-500"} hover:bg-secondary transition duration-300 relative`}
							onClick={() => setFeedType("posts")}
						>
							Posts
							{feedType === "posts" && (
								<div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary' />
							)}
						</button>
						<button
							className={`flex justify-center flex-1 p-3 ${feedType === "likes" ? "" : "text-slate-500"} hover:bg-secondary transition duration-300 relative`}
							onClick={() => setFeedType("likes")}
						>
							Likes
							{feedType === "likes" && (
								<div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary' />
							)}
						</button>
					</div>
					<Posts feedType={feedType} username={username} userId={user._id} />
					{/* Repost Post..... */}
					<h1 className='text-lg font-bold mt-4 ml-5'>Reposts</h1>
					<Posts feedType={"reposts"} username={username} userId={user._id} />
				</>
			)}
		</div>
	);
};

export default ProfilePage;