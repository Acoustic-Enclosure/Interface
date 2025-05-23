
// interface PaginationInfo {
//     total: number;
//     perPage: number;
//     currentPage: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPreviousPage: boolean;
// }

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange
}: PaginationProps) {
    return (
        <div className="flex justify-center items-center space-x-4 mt-8 pb-6">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                currentPage === 1
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-purple hover:bg-opacity-90"
                }`}
            >
                Previous
            </button>
            
            <span className="text-foreground">
                Page {currentPage} of {totalPages}
            </span>
            
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 rounded-md ${
                currentPage >= totalPages
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-purple hover:bg-opacity-90"
                }`}
            >
                Next
            </button>
        </div>
    );
}