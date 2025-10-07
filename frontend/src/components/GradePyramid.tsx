import { GRADE_PYRAMID } from '../utils/literacyTypes';

interface GradePyramidProps {
  currentGrade: number; // 1-9
  className?: string;
}

export function GradePyramid({ currentGrade, className = '' }: GradePyramidProps) {
  return (
    <div className={`relative ${className}`}>
      {/* 피라미드 구조 */}
      <div className="flex flex-col items-center gap-0.5">
        {GRADE_PYRAMID.map((level) => {
          const isCurrentLevel = level.level === currentGrade;
          const width = `${level.percentage * 4}%`; // 최대 80%

          return (
            <div
              key={level.level}
              className="relative group transition-all duration-300"
              style={{ width }}
            >
              {/* 피라미드 블록 */}
              <div
                className={`
                  relative h-14 rounded-lg transition-all duration-300
                  ${isCurrentLevel
                    ? 'ring-4 ring-purple-600 ring-offset-2 shadow-2xl scale-105 z-10'
                    : 'hover:scale-105 hover:shadow-lg'
                  }
                `}
                style={{
                  backgroundColor: level.color,
                }}
              >
                {/* 레벨 정보 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`
                        font-bold text-sm
                        ${level.level <= 3 ? 'text-white' : 'text-purple-900'}
                        ${isCurrentLevel ? 'text-lg' : ''}
                      `}
                    >
                      {level.level}등급
                    </div>
                    <div
                      className={`
                        text-xs
                        ${level.level <= 3 ? 'text-purple-100' : 'text-purple-700'}
                        ${isCurrentLevel ? 'font-semibold' : ''}
                      `}
                    >
                      {level.label}
                    </div>
                  </div>
                </div>

                {/* 현재 위치 마커 */}
                {isCurrentLevel && (
                  <>
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                      <div className="w-8 h-0.5 bg-purple-600"></div>
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                        내 위치
                      </div>
                    </div>
                  </>
                )}

                {/* 호버 툴팁 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    {level.description}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 설명 텍스트 */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          당신은 <span className="font-bold text-purple-600">{GRADE_PYRAMID[currentGrade - 1]?.label}</span> 등급입니다
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {GRADE_PYRAMID[currentGrade - 1]?.description}
        </p>
      </div>
    </div>
  );
}
