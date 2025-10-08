import { GRADE_PYRAMID } from '../utils/literacyTypes';

interface GradeDistributionProps {
  currentGrade: number; // 1-9
  className?: string;
}

export function GradeDistribution({ currentGrade, className = '' }: GradeDistributionProps) {
  // 표준편차 분포 (정규분포 형태)
  const distribution = [
    { grade: 1, percentage: 5, label: '최상위' },
    { grade: 2, percentage: 10, label: '상위' },
    { grade: 3, percentage: 20, label: '중상' },
    { grade: 4, percentage: 30, label: '중위' },
    { grade: 5, percentage: 20, label: '중하' },
    { grade: 6, percentage: 10, label: '하위' },
    { grade: 7, percentage: 5, label: '최하위' },
  ];

  return (
    <div className={`${className}`}>
      <style>{`
        @media print {
          .distribution-bar {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* 표준편차 분포 그래프 */}
      <div className="space-y-2">
        {distribution.map((item) => {
          const isCurrentGrade = item.grade === currentGrade;
          const gradeData = GRADE_PYRAMID[item.grade - 1];

          return (
            <div key={item.grade} className="flex items-center gap-3">
              {/* 등급 레이블 */}
              <div className={`w-16 text-right text-sm font-semibold ${isCurrentGrade ? 'text-violet-800' : 'text-gray-700'}`}>
                {item.grade}등급
              </div>

              {/* 분포 바 */}
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`distribution-bar h-full transition-all duration-500 ${isCurrentGrade ? 'ring-2 ring-violet-800' : ''}`}
                    style={{
                      width: `${item.percentage * 3}%`, // 최대 90%
                      backgroundColor: gradeData?.color || '#9333EA',
                    }}
                  >
                    {isCurrentGrade && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">내 등급</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 비율 */}
              <div className={`w-12 text-right text-xs ${isCurrentGrade ? 'font-bold text-violet-800' : 'text-gray-600'}`}>
                {item.percentage}%
              </div>
            </div>
          );
        })}
      </div>

      {/* 설명 */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          전체 응시자 중 상위 <span className="font-bold text-violet-800">
            {distribution.slice(0, currentGrade - 1).reduce((sum, d) => sum + d.percentage, 0) + distribution[currentGrade - 1].percentage / 2}%
          </span>
        </p>
      </div>
    </div>
  );
}
