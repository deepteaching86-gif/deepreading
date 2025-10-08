import React, { useState } from 'react';
import axios from '../../lib/axios';

const BulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(`/api/v1/admin/bulk-upload/template`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'literacy_test_universal_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('템플릿 다운로드 실패:', err);
      alert(err.response?.data?.message || '템플릿 다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택하세요.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setResults([]);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/v1/admin/bulk-upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5분 (300초) - AI 채점 시간 고려
      });

      setResults(response.data.results);
      alert(`업로드 성공! ${response.data.results.length}명의 학생 데이터가 생성되었습니다.`);
      setFile(null);
    } catch (err: any) {
      console.error('업로드 실패:', err);
      setError(err.response?.data?.message || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">학생 데이터 대량 업로드</h1>

        {/* 템플릿 다운로드 */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">1. 통합 엑셀 템플릿 다운로드</h2>
          <div className="mb-4">
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {downloading ? '다운로드 중...' : '📥 통합 템플릿 다운로드'}
            </button>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="text-sm text-foreground font-medium">✨ 통합 템플릿 특징:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 한 파일로 모든 학년 학생 데이터 입력 가능</li>
              <li>• 각 행에 학년과 템플릿코드를 입력하여 여러 학년을 한번에 처리</li>
              <li>• 최대 50개 문항까지 지원 (Q1~Q50)</li>
              <li>• 사용 안내 시트 포함</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              템플릿 코드: ELEM1-V1 ~ ELEM6-V1 (초등 1~6학년), MIDDLE1-V1 ~ MIDDLE3-V1 (중등 1~3학년)
            </p>
          </div>
        </div>

        {/* 파일 업로드 */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">2. 작성한 엑셀 파일 업로드</h2>

          <div className="mb-4">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer border border-border rounded-lg"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                선택된 파일: {file.name}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {uploading ? '업로드 중...' : '📤 업로드 및 자동 채점 시작'}
          </button>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            * 주관식/서술형은 AI(GPT-4o-mini)가 자동 채점합니다
          </p>
        </div>

        {/* 결과 */}
        {results.length > 0 && (
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">업로드 결과</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">행</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">학생명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">이메일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">점수</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">상태</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">{result.row}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">{result.studentName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">{result.studentEmail}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">{result.score}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          result.status === 'success'
                            ? 'bg-chart-1/20 text-chart-1'
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {result.status === 'success' ? '성공' : '실패'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
