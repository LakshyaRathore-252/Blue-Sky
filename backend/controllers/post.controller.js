import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
	try {
		const { text } = req.body;
		let { img } = req.body;
		const userId = req.user._id.toString();

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!text && !img) {
			return res.status(400).json({ error: "Post must have text or image" });
		}

		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		const newPost = new Post({
			user: userId,
			text,
			img,
		});

		await newPost.save();
		res.status(201).json(newPost);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
	}
};

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = { user: userId, text };

		post.comments.push(comment);
		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
			await notification.save();

			const updatedLikes = post.likes;
			res.status(200).json(updatedLikes);
		}
	} catch (error) {
		console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		if (posts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const countPostImpressions = async (req, res) => {
	try {
		const userId = req.user._id;
		const now = new Date();
		const sevenDaysAgo = new Date(now);
		sevenDaysAgo.setDate(now.getDate() - 6); // Include today

		// Fetch posts created by the user in the last 7 days
		const posts = await Post.find({
			user: userId,
			createdAt: { $gte: sevenDaysAgo }
		})
			.populate({ path: "likes", select: "createdAt" })
			.populate({ path: "comments", select: "createdAt" });

		console.log("Fetched posts:", posts);

		// Create a map for the last 7 days
		const dailyImpressions = {};
		for (let i = 0; i < 7; i++) {
			const date = new Date(now);
			date.setDate(now.getDate() - i);
			const dayKey = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
			dailyImpressions[dayKey] = 0;
		}

		console.log("Daily Impression Date Keys:", Object.keys(dailyImpressions));

		let totalLikes = 0; // Track total likes
		let totalComments = 0; // Track total comments

		// Process each post
		posts.forEach((post) => {
			// Count likes
			post.likes.forEach((like) => {
				if (!like.createdAt) return;
				const likeDate = new Date(like.createdAt);
				if (isNaN(likeDate)) return;
				const dayKey = likeDate.toISOString().split("T")[0];

				console.log(`Like at ${likeDate}: Added to ${dayKey}`);

				if (dailyImpressions[dayKey] !== undefined) {
					dailyImpressions[dayKey]++;
				}
			});

			// Count comments
			post.comments.forEach((comment) => {
				if (!comment.createdAt) return;
				const commentDate = new Date(comment.createdAt);
				if (isNaN(commentDate)) return;
				const dayKey = commentDate.toISOString().split("T")[0];

				console.log(`Comment at ${commentDate}: Added to ${dayKey}`);

				if (dailyImpressions[dayKey] !== undefined) {
					dailyImpressions[dayKey]++;
				}
			});

			// Add to total likes and comments
			totalLikes += post.likes.length;
			totalComments += post.comments.length;
		});

		console.log("Daily Impressions:", dailyImpressions);

		// Convert to chart format
		const chartData = Object.entries(dailyImpressions).map(([date, value]) => ({
			name: date,
			value
		})).reverse(); // Ensure it's in chronological order

		// Calculate total impressions as the sum of likes and comments
		const totalImpressions = totalLikes + totalComments;
		const averageImpressions = totalImpressions / 7;

		console.log("Final Chart Data:", chartData);

		res.status(200).json({
			success: true,
			data: {
				chartData,
				totalLikes,
				totalComments,
				totalImpressions,
				averageImpressions
			}
		});
	} catch (error) {
		console.error("Error counting post impressions:", error);
		res.status(500).json({
			success: false,
			message: "Server error. Could not count post impressions."
		});
	}
};


// Return followers and following data in the specified format
export const countFollowersFollowing = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate("followers following");

		const data = [
			{ name: 'Followers', value: user.followers.length },
			{ name: 'Following', value: user.following.length }
		];

		res.status(200).json({
			success: true,
			data
		});
	} catch (error) {
		console.error("Error counting followers and following:", error);
		res.status(500).json({
			success: false,
			message: "Server error. Could not count followers and following.",
		});
	}
};


// Repost COntroller...

export const repostPost = async (req, res) => {
	try {
		const { postId } = req.params;
		const userId = req.user._id; // Assuming you have user information in req.user

		// Check if the post exists
		const post = await Post.findById(postId);
		console.log("Post:", post);
		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// Check if the user has already reposted the post
		if (post.reposts.includes(userId)) {
			return res.status(400).json({
				success: false,
				message: "You have already reposted this post"
			});
		}

		// Add the user to the reposts array
		post.reposts.push(userId);
		await post.save();

		// Create a notification for the post owner
		if (post.user.toString() !== userId.toString()) {
			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "repost",
			});
			await notification.save();
		}

		res.status(200).json({ message: "Post reposted successfully", post });
	} catch (error) {
		res.status(500).json({ message: "Something went wrong", error: error.message });
	}
};

export const getAllReposts = async (req, res) => {
	try {
		const userId = req.params.userId;
		console.log("Fetching all reposts for user:", userId);

		// Find all posts where the user has reposted
		const reposts = await Post.find({ reposts: userId }).populate("user", "username fullName profileImg");

		console.log(reposts)
		if (!reposts) {
			return res.status(404).json({ message: "No reposts found" });
		}

		res.status(200).json(reposts);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};



export const bookmarkPost = async (req, res) => {
	try {
		const userId = req.user._id; // Assuming you have user info in req.user
		const { postId } = req.params;

		console.log("Toggling bookmark for post:", userId, postId);

		// Check if the user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Check if the post exists
		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// Toggle bookmark
		const isBookmarked = user.bookmarks.includes(postId);
		if (isBookmarked) {
			// Remove from bookmarks
			user.bookmarks = user.bookmarks.filter((id) => id.toString() !== postId);
		} else {
			// Add to bookmarks
			user.bookmarks.push(postId);
		}

		await user.save();

		res.status(200).json({
			message: isBookmarked ? "Post removed from bookmarks" : "Post bookmarked successfully",
			bookmarks: user.bookmarks,
		});
	} catch (error) {
		console.error("Error toggling bookmark:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};





export const getBookmarkedPosts = async (req, res) => {
	try {
		const { userId } = req.params;

		console.log("Fetching bookmarked posts for user:", userId);

		// Validate userId format
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: "Invalid user ID" });
		}

		// Find the user and populate the bookmarked posts
		const user = await User.findById(userId)
			.populate({
				path: "bookmarks",
				select: "-__v",
				populate: {
					path: "user",
					select: "username fullName profileImg",
				},
			})
			.lean();

		// Check if the user exists
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Return bookmarks directly
		res.status(200).json(user.bookmarks || []);
	} catch (error) {
		console.error("Error in getBookmarkedPosts controller:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
