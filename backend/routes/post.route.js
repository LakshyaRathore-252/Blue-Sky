import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
	commentOnPost,
	countFollowersFollowing,
	countPostImpressions,
	createPost,
	deletePost,
	getAllPosts,
	getFollowingPosts,
	getLikedPosts,
	getUserPosts,
	likeUnlikePost,
	repostPost,
	getAllReposts,
	bookmarkPost,
	getBookmarkedPosts,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);
router.get("/countImpressions", protectRoute, countPostImpressions);
router.get("/getFollowersFollowing", protectRoute, countFollowersFollowing);
router.post("/:postId/repost", protectRoute, repostPost);
router.get("/getAllReposts/:userId", protectRoute, getAllReposts);

// Bookmark a post
router.post("/bookmark/:postId", protectRoute, bookmarkPost);
// Route to fetch all bookmarked posts for a user
router.get("/bookmarks/:userId", protectRoute, getBookmarkedPosts);
export default router;
