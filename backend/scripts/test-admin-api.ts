import axios from 'axios';

const API_URL = 'https://literacy-backend.onrender.com/api/v1';

async function testAdminAPI() {
  try {
    console.log('1. 관리자 로그인 테스트...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@literacy.com',
      password: 'admin1234',
    });

    const token = loginRes.data.data.accessToken;
    console.log('✅ 로그인 성공');
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'Token not found');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. 대시보드 통계 조회...');
    const statsRes = await axios.get(`${API_URL}/admin/dashboard/stats`, { headers });
    console.log('✅ 통계:', JSON.stringify(statsRes.data.data, null, 2));

    console.log('\n3. 최근 사용자 조회...');
    const usersRes = await axios.get(`${API_URL}/admin/users/recent?limit=5`, { headers });
    console.log('✅ 최근 사용자:', usersRes.data.data.length, '명');

    console.log('\n4. 학년별 통계 조회...');
    const gradeStatsRes = await axios.get(`${API_URL}/admin/stats/by-grade`, { headers });
    console.log('✅ 학년별 통계:', gradeStatsRes.data.data.length, '개');

    console.log('\n5. 템플릿 목록 조회...');
    const templatesRes = await axios.get(`${API_URL}/admin/templates`, { headers });
    console.log('✅ 템플릿:', templatesRes.data.data.length, '개');

    console.log('\n6. 엑셀 템플릿 다운로드 테스트...');
    const templateRes = await axios.get(`${API_URL}/admin/bulk-upload/template?templateCode=ELEM3-V1`, {
      headers,
      responseType: 'blob',
    });
    console.log('✅ 템플릿 다운로드 성공:', templateRes.data.size || templateRes.data.length, 'bytes');

    console.log('\n✅ 모든 테스트 통과!');
  } catch (error: any) {
    console.error('❌ 에러 발생:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('URL:', error.config?.url);
  }
}

testAdminAPI();
