import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from '../../types';
import {
  PlaceReview,
  deleteReview,
  fetchMyReviewForPlace,
  fetchReviewsForPlace,
  upsertReview,
} from '../../services/travelReviewsService';

interface PlaceReviewsProps {
  placeId: string;
  user: User;
  onGuestRestricted: () => void;
  onStatsChange?: (stats: { averageRating: number; reviewCount: number }) => void;
}

const StarRow: React.FC<{ rating: number; interactive?: boolean; onChange?: (rating: number) => void }> = ({
  rating,
  interactive = false,
  onChange,
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        disabled={!interactive}
        onClick={() => onChange?.(star)}
        className={`text-[20px] leading-none transition-colors ${
          star <= rating ? 'text-[#f4d125]' : 'text-slate-300 dark:text-white/20'
        } ${interactive ? 'cursor-pointer hover:text-[#f4d125]' : 'cursor-default'}`}
        aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
      >
        ★
      </button>
    ))}
  </div>
);

const PlaceReviews: React.FC<PlaceReviewsProps> = ({ placeId, user, onGuestRestricted, onStatsChange }) => {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [myReview, setMyReview] = useState<PlaceReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const avgRating = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    [reviews]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, mine] = await Promise.all([
        fetchReviewsForPlace(placeId),
        user.isGuest ? Promise.resolve(null) : fetchMyReviewForPlace(placeId, user.id),
      ]);
      setReviews(all);
      setMyReview(mine);
      setEditing(!mine);
      setDraftRating(mine?.rating ?? 0);
      setDraftText(mine?.review_text ?? '');
    } catch {
      setReviews([]);
      setMyReview(null);
      setError('Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [placeId, user.id, user.isGuest]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onStatsChange?.({ averageRating: avgRating, reviewCount: reviews.length });
  }, [avgRating, onStatsChange, reviews.length]);

  const handleSubmit = async () => {
    if (user.isGuest) {
      onGuestRestricted();
      return;
    }
    if (draftRating === 0) {
      setError('Please choose a star rating');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await upsertReview({
        place_id: placeId,
        user_id: user.id,
        rating: draftRating,
        review_text: draftText.trim() || undefined,
      });
      setEditing(false);
      await load();
    } catch {
      setError('Could not save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview || user.isGuest) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteReview(placeId, user.id);
      setMyReview(null);
      setDraftRating(0);
      setDraftText('');
      await load();
    } catch {
      setError('Could not delete review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-950">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg leading-none text-[#f4d125]">★</span>
            <span className="text-sm font-black text-slate-950">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({reviews.length})</span>
          </div>
        )}
      </div>

      {!user.isGuest && (myReview && !editing ? (
        <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <StarRow rating={myReview.rating} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(true)} className="text-[10px] font-black uppercase tracking-widest text-primary">Edit</button>
              <button type="button" onClick={handleDelete} className="text-[10px] font-black uppercase tracking-widest text-red-500">Delete</button>
            </div>
          </div>
          {myReview.review_text && <p className="text-sm text-slate-600">{myReview.review_text}</p>}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-slate-950/10 p-4 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            {myReview ? 'Update your review' : 'Leave a review'}
          </p>
          <StarRow rating={draftRating} interactive onChange={setDraftRating} />
          <textarea
            value={draftText}
            onChange={event => setDraftText(event.target.value)}
            placeholder="Share your experience... (optional)"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-950/10 bg-white/70 px-4 py-3 text-sm text-slate-950 outline-none focus:border-primary"
          />
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="h-11 flex-1 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-[#0a1a0f] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Submit Review'}
            </button>
            {myReview && (
              <button type="button" onClick={() => setEditing(false)} className="h-11 rounded-2xl border border-slate-200 px-4 text-[11px] font-black text-slate-600">
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}

      {user.isGuest && (
        <button
          type="button"
          onClick={onGuestRestricted}
          className="w-full rounded-2xl border border-dashed border-primary/40 py-4 text-[11px] font-black uppercase tracking-widest text-primary"
        >
          Sign in to leave a review
        </button>
      )}

      {loading ? (
        <p className="py-4 text-center text-xs text-slate-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
                {review.author_initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-slate-900">{review.author_name}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <StarRow rating={review.rating} />
                {review.review_text && <p className="mt-1 text-xs leading-relaxed text-slate-600">{review.review_text}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceReviews;
