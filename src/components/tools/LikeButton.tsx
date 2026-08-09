import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { Query, ID } from 'appwrite';

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

export function LikeButton({ toolSlug, initialLikes = 0, onLikeChange }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState<boolean>(() => {
    const likes = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
    return Array.isArray(likes) && likes.includes(toolSlug);
  });
  const [count, setCount] = useState<number>(() => {
    const saved = localStorage.getItem(`qofeno_likes_count_${toolSlug}`);
    return saved ? Number(saved) : (initialLikes || 0);
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialLikes > 0) {
      setCount(initialLikes);
      localStorage.setItem(`qofeno_likes_count_${toolSlug}`, String(initialLikes));
    }
  }, [initialLikes, toolSlug]);

  useEffect(() => {
    const likes = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
    const isLikedLocal = Array.isArray(likes) && likes.includes(toolSlug);
    setLiked(isLikedLocal);

    if (user) {
      databases.listDocuments(DATABASE_ID, 'tool_likes', [
        Query.equal('user_id', user.id),
        Query.equal('tool_slug', toolSlug),
        Query.limit(1)
      ]).then((r) => {
        if (r.total > 0) setLiked(true);
      }).catch(() => {});
    }
  }, [user, toolSlug]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    const nextLiked = !liked;
    const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);
    setLiked(nextLiked);
    setCount(nextCount);
    localStorage.setItem(`qofeno_likes_count_${toolSlug}`, String(nextCount));

    const likesArray: string[] = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
    const updatedLikes = nextLiked
      ? Array.from(new Set([...likesArray, toolSlug]))
      : likesArray.filter((slug) => slug !== toolSlug);
    localStorage.setItem('qofeno_likes', JSON.stringify(updatedLikes));

    if (onLikeChange) onLikeChange(nextCount, nextLiked);

    try {
      if (user) {
        const existing = await databases.listDocuments(DATABASE_ID, 'tool_likes', [
          Query.equal('user_id', user.id),
          Query.equal('tool_slug', toolSlug),
          Query.limit(1)
        ]);

        if (nextLiked) {
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
      } else {
        const likes: string[] = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
        if (nextLiked) {
          if (!likes.includes(toolSlug)) likes.push(toolSlug);
        } else {
          const idx = likes.indexOf(toolSlug);
          if (idx > -1) likes.splice(idx, 1);
        }
        localStorage.setItem('qofeno_likes', JSON.stringify(likes));
      }

      // Update tool_views count/likes record if exists
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
      console.warn("Failed to persist like state:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer ${
        liked
          ? "bg-red-50 text-red-500 border border-red-200/80 shadow-sm"
          : "bg-neutral-50 text-neutral-600 border border-neutral-200/70 hover:border-red-200 hover:text-red-500"
      }`}
      title={liked ? "Unlike tool" : "Like tool"}
    >
      <FontAwesomeIcon
        icon={liked ? faHeartSolid : faHeartRegular}
        className={`w-3.5 h-3.5 ${liked ? "text-red-500" : "text-neutral-400 group-hover:text-red-500"}`}
      />
      <span>{formatCount(count)}</span>
    </button>
  );
}
