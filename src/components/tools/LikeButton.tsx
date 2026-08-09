import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp as faThumbsUpSolid, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faThumbsUp as faThumbsUpRegular, faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { Query, ID } from 'appwrite';
import { motion, AnimatePresence } from 'framer-motion';

interface LikeButtonProps {
  toolSlug: string;
  initialLikes?: number;
  onLikeChange?: (newCount: number, isLiked: boolean) => void;
}

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
}

/** ── PUBLIC LIKES BUTTON (Thumbs Up) ────────────────────────────────── */
export function LikeButton({ toolSlug, initialLikes = 0, onLikeChange }: LikeButtonProps) {
  const [liked, setLiked] = useState<boolean>(() => {
    const userLikes = JSON.parse(localStorage.getItem('qofeno_public_likes') || '[]');
    return Array.isArray(userLikes) && userLikes.includes(toolSlug);
  });
  const [count, setCount] = useState<number>(() => {
    const saved = localStorage.getItem(`qofeno_likes_count_${toolSlug}`);
    return saved ? Number(saved) : (initialLikes || 0);
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialLikes > 0) {
      setCount(initialLikes);
      localStorage.setItem(`qofeno_likes_count_${toolSlug}`, String(initialLikes));
    }
  }, [initialLikes, toolSlug]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    const nextLiked = !liked;
    const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);
    setLiked(nextLiked);
    setCount(nextCount);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1500);

    setLoading(true);
    localStorage.setItem(`qofeno_likes_count_${toolSlug}`, String(nextCount));

    const userLikes: string[] = JSON.parse(localStorage.getItem('qofeno_public_likes') || '[]');
    const updatedLikes = nextLiked
      ? Array.from(new Set([...userLikes, toolSlug]))
      : userLikes.filter((slug) => slug !== toolSlug);
    localStorage.setItem('qofeno_public_likes', JSON.stringify(updatedLikes));

    if (onLikeChange) onLikeChange(nextCount, nextLiked);

    try {
      const viewDocs = await databases.listDocuments(DATABASE_ID, 'tool_views', [
        Query.equal('tool_slug', toolSlug),
        Query.limit(1)
      ]);

      if (viewDocs.total > 0) {
        await databases.updateDocument(DATABASE_ID, 'tool_views', viewDocs.documents[0].$id, {
          likes: nextCount
        });
      } else {
        await databases.createDocument(DATABASE_ID, 'tool_views', ID.unique(), {
          tool_slug: toolSlug,
          count: 1,
          likes: nextCount
        });
      }
    } catch (err) {
      console.warn("Failed to persist public like state:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <AnimatePresence>
        {showToast && (
          <motion.span
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm border ${
              liked
                ? "bg-purple-50 text-purple-600 border-purple-200"
                : "bg-neutral-100 text-neutral-600 border-neutral-200"
            }`}
          >
            {liked ? "Liked tool 👍" : "Unliked tool"}
          </motion.span>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer ${
          liked
            ? "bg-purple-50 text-purple-600 border border-purple-200/80 shadow-sm"
            : "bg-neutral-50 text-neutral-600 border border-neutral-200/70 hover:border-purple-200 hover:text-purple-600"
        }`}
        title={liked ? "Unlike tool" : "Like tool"}
      >
        <FontAwesomeIcon
          icon={liked ? faThumbsUpSolid : faThumbsUpRegular}
          className={`w-3.5 h-3.5 ${liked ? "text-purple-600" : "text-neutral-400 group-hover:text-purple-600"}`}
        />
        <span>{formatCount(count)}</span>
      </button>
    </div>
  );
}

/** ── PERSONAL FAVORITES BUTTON (Heart) ────────────────────────────────── */
export function FavoriteButton({ toolSlug, showLabel = false }: { toolSlug: string; showLabel?: boolean }) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState<boolean>(() => {
    const favs = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
    return Array.isArray(favs) && favs.includes(toolSlug);
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
    setIsFav(Array.isArray(favs) && favs.includes(toolSlug));
  }, [toolSlug]);

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const nextFav = !isFav;
    setIsFav(nextFav);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1500);

    const favsArray: string[] = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
    const updatedFavs = nextFav
      ? Array.from(new Set([...favsArray, toolSlug]))
      : favsArray.filter((slug) => slug !== toolSlug);
    localStorage.setItem('qofeno_likes', JSON.stringify(updatedFavs));

    try {
      if (user?.id) {
        const existing = await databases.listDocuments(DATABASE_ID, 'tool_likes', [
          Query.equal('user_id', user.id),
          Query.equal('tool_slug', toolSlug),
          Query.limit(1)
        ]);

        if (nextFav) {
          if (existing.total === 0) {
            await databases.createDocument(DATABASE_ID, 'tool_likes', ID.unique(), {
              user_id: user.id,
              tool_slug: toolSlug,
              created_at: new Date().toISOString()
            });
          }
        } else {
          if (existing.total > 0) {
            await databases.deleteDocument(DATABASE_ID, 'tool_likes', existing.documents[0].$id);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to persist favourite state:", err);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <AnimatePresence>
        {showToast && (
          <motion.span
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm border ${
              isFav
                ? "bg-pink-50 text-pink-600 border-pink-200"
                : "bg-neutral-100 text-neutral-600 border-neutral-200"
            }`}
          >
            {isFav ? "Added to favourites" : "Removed from favourites"}
          </motion.span>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleToggleFav}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer ${
          isFav
            ? "bg-pink-50 text-pink-600 border border-pink-200/80 shadow-sm"
            : "bg-neutral-50 text-neutral-600 border border-neutral-200/70 hover:border-pink-200 hover:text-pink-600"
        }`}
        title={isFav ? "Remove from favourites" : "Add to favourites"}
      >
        <FontAwesomeIcon
          icon={isFav ? faHeartSolid : faHeartRegular}
          className={`w-3.5 h-3.5 ${isFav ? "text-pink-600" : "text-neutral-400 group-hover:text-pink-600"}`}
        />
        {showLabel && <span>{isFav ? "Favorited" : "Favorite"}</span>}
      </button>
    </div>
  );
}
