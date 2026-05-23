const SkeletonCard = () => (
    <div className="card p-4 flex flex-col gap-3">
        <div className="skeleton h-48 w-full rounded-xl" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="flex gap-2 mt-auto">
            <div className="skeleton h-10 flex-1 rounded-lg" />
            <div className="skeleton h-10 w-24 rounded-lg" />
        </div>
    </div>
);

export default SkeletonCard;