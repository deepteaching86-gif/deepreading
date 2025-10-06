import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

interface A4ReportPageProps {
  children: React.ReactNode;
  pageNumber: number;
  totalPages: number;
  title: string;
  onExportImage?: (dataUrl: string, pageNumber: number) => void;
}

/**
 * A4 크기 레포트 페이지 컴포넌트
 * - 210mm x 297mm (A4)
 * - 1240px x 1754px @ 150dpi
 * - 절대 깨지지 않는 고정 크기
 */
export const A4ReportPage: React.FC<A4ReportPageProps> = ({
  children,
  pageNumber,
  totalPages,
  title,
  onExportImage,
}) => {
  const pageRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!pageRef.current) return;

    try {
      const canvas = await html2canvas(pageRef.current, {
        scale: 2, // 고해상도
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png');

      if (onExportImage) {
        onExportImage(dataUrl, pageNumber);
      } else {
        // 기본 동작: 다운로드
        const link = document.createElement('a');
        link.download = `${title}-page-${pageNumber}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('이미지 내보내기 실패:', error);
      alert('이미지 내보내기에 실패했습니다.');
    }
  };

  return (
    <div className="relative">
      {/* A4 페이지 컨테이너 */}
      <div
        ref={pageRef}
        className="bg-white mx-auto shadow-lg"
        style={{
          width: '210mm', // A4 너비
          height: '297mm', // A4 높이
          padding: '20mm', // 여백
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden', // 내용이 넘치지 않도록
        }}
      >
        {/* 헤더 */}
        <div className="border-b-2 border-gray-300 pb-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <div className="text-sm text-gray-500 mt-1">
            Page {pageNumber} of {totalPages}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="report-content">
          {children}
        </div>

        {/* 푸터 */}
        <div
          className="absolute bottom-5 left-5 right-5 text-center text-xs text-gray-400 border-t border-gray-200 pt-2"
        >
          문해력 평가 시스템 | 생성일: {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 이미지 내보내기 버튼 */}
      <div className="flex justify-center mt-4 gap-2 print:hidden">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          📸 이미지로 저장 (Page {pageNumber})
        </button>
      </div>
    </div>
  );
};
