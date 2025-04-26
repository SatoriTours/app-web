import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange
}: SimplePaginationProps) {
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());

  // 处理页码输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value.replace(/\D/g, ''));
  };

  // 处理页码确认
  const handlePageInputConfirm = () => {
    const pageNum = parseInt(inputPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // 如果输入无效，重置为当前页码
      setInputPage(currentPage.toString());
    }
  };

  // 处理输入框按键事件，按回车确认
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputConfirm();
    }
  };

  // 页码输入框失焦时确认
  const handleBlur = () => {
    handlePageInputConfirm();
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
        disabled={currentPage <= 1}
        className="h-8 px-3"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="sr-only">上一页</span>
      </Button>

      <div className="flex items-center space-x-1">
        <Input
          value={inputPage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 w-14 text-center"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">/ {totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
        disabled={currentPage >= totalPages}
        className="h-8 px-3"
      >
        <ChevronRightIcon className="w-4 h-4" />
        <span className="sr-only">下一页</span>
      </Button>
    </div>
  );
}
