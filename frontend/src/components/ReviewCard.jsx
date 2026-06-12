import { useState, useRef } from 'react';
import { FiStar, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReviewCard = ({ review }) => {
    const userImages = (() => {
        try {
            if (!review.images) return [];
            if (Array.isArray(review.images)) return review.images.filter(Boolean);
            if (review.images === 'NULL' || review.images === '[]') return [];
            const parsed = JSON.parse(review.images);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch { return []; }
    })();

    const displayImages = (() => {
        if (userImages.length > 0) return userImages;
        const prodImg = review.product_image;
        if (prodImg) {
            const src = prodImg.startsWith('http')
                ? prodImg
                : `${BACKEND}/${prodImg.replace(/^\//, '')}`;
            return [src];
        }
        return [];
    })();

    const [imgIdx, setImgIdx] = useState(0);
    const imgScrollRef = useRef(null);

    const handleImgScroll = (direction) => {
        if (imgScrollRef.current) {
            const container = imgScrollRef.current;
            const scrollAmount = direction === 'left' ? -container.clientWidth : container.clientWidth;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleScrollEvent = () => {
        if (imgScrollRef.current) {
            const container = imgScrollRef.current;
            const index = Math.round(container.scrollLeft / container.clientWidth);
            if (index !== imgIdx && index >= 0 && index < displayImages.length) {
                setImgIdx(index);
            }
        }
    };

    const goToImage = (index) => {
        if (imgScrollRef.current) {
            const container = imgScrollRef.current;
            container.scrollTo({
                left: index * container.clientWidth,
                behavior: 'smooth'
            });
            setImgIdx(index);
        }
    };

    if (!review) return null;

    return (
        <div
            className="flex flex-col w-full overflow-hidden"
            style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: '7px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
        >
            {/* Image area — fixed height so all cards are consistent */}
            {displayImages.length > 0 ? (
                <div className="relative overflow-hidden shrink-0" style={{ height: '160px', background: 'var(--primary-glow)' }}>
                    <div
                        ref={imgScrollRef}
                        onScroll={handleScrollEvent}
                        className="flex overflow-x-auto snap-x snap-mandatory flex-nowrap no-scrollbar scroll-smooth w-full h-full"
                        style={{
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        {displayImages.map((src, i) => (
                            <div
                                key={i}
                                className="w-full h-full shrink-0 snap-center relative"
                            >
                                <img
                                    src={src}
                                    alt={`Review photo ${i + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Arrow navigation — only when multiple images */}
                    {displayImages.length > 1 && (
                        <>
                            <button
                                className="review-img-arrow review-img-prev"
                                onClick={(e) => { e.stopPropagation(); handleImgScroll('left'); }}
                                aria-label="Previous image"
                            >
                                <FiChevronLeft size={14} />
                            </button>
                            <button
                                className="review-img-arrow review-img-next"
                                onClick={(e) => { e.stopPropagation(); handleImgScroll('right'); }}
                                aria-label="Next image"
                            >
                                <FiChevronRight size={14} />
                            </button>

                            {/* Dot indicators */}
                            <div className="review-img-dots">
                                {displayImages.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`review-img-dot${i === imgIdx ? ' active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); goToImage(i); }}
                                        aria-label={`Go to image ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                /* No images — fixed height placeholder */
                <div className="relative shrink-0 overflow-hidden flex items-center justify-center" style={{ height: '160px', background: 'var(--primary-glow)' }}>
                    <FiImage size={32} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                </div>
            )}

            {/* Review content */}
            <div className="px-3.5 py-3 flex flex-col flex-1 justify-between gap-2">
                <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-sm text-[var(--text-main)] truncate" title={review.customer_name || 'Anonymous'}>
                            {review.customer_name || 'Anonymous'}
                        </h3>
                        <div className="flex text-amber-400 shrink-0">
                            {[...Array(5)].map((_, i) => (
                                <FiStar key={i} size={13} fill={i < (review.rating || 0) ? "currentColor" : "none"} stroke="currentColor" />
                            ))}
                        </div>
                    </div>

                    {(review.product_name || review.product_id?.name) && (
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-[7px] bg-[var(--primary-glow)] border border-[var(--border)] mb-2" style={{ color: 'var(--primary)', width: 'fit-content' }}>
                            {review.product_name || review.product_id?.name}
                        </span>
                    )}

                    <p className="text-xs italic leading-relaxed text-[var(--text-muted)] line-clamp-3">
                        "{review.message || ''}"
                    </p>
                </div>

                {/* Date footer */}
                <div className="text-[10px] text-right font-medium" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
                    {new Date(review.created_at || review.createdAt || Date.now()).toLocaleDateString('en-GB')}
                </div>
            </div>
        </div>
    );
};

export default ReviewCard;
