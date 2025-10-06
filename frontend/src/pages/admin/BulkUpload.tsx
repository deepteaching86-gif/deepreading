import React, { useState } from 'react';
import axios from '../../lib/axios';

const BulkUpload: React.FC = () => {
  const [templateCode, setTemplateCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleDownloadTemplate = async () => {
    try {
      if (!templateCode) {
        alert('템플릿 코드를 입력하세요.');
        return;
      }

      const response = await axios.get(`/api/v1/admin/bulk-upload/template`, {
        params: { templateCode },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templateCode}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('템플릿 다운로드 실패:', err);
      alert(err.response?.data?.message || '템플릿 다운로드에 실패했습니다.');
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

    if (!templateCode) {
      setError('템플릿 코드를 입력하세요.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setResults([]);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateCode', templateCode);

      const response = await axios.post('/api/v1/admin/bulk-upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
          <h2 className="text-xl font-semibold mb-4 text-foreground">1. 엑셀 템플릿 다운로드</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              placeholder="템플릿 코드 (예: ELEM3-V1)"
              className="flex-1 border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleDownloadTemplate}
              disabled={!templateCode}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              템플릿 다운로드
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            * 템플릿 코드 예시: ELEM1-V1 ~ ELEM6-V1 (초등), MIDDLE1-V1 ~ MIDDLE3-V1 (중등)
          </p>
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
            disabled={!file || !templateCode || uploading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {uploading ? '업로드 중...' : '업로드 및 데이터 생성'}
          </button>
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
