export default function EmptyState() {
    return (
        <div className="bg-lighterBlack p-8 rounded-md text-center">
            <p className="text-lg mb-2">No tuning data found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or check back later</p>
        </div>
    );
}