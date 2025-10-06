import axios from 'axios';

const API_URL = 'https://literacy-backend.onrender.com';

async function testAPIs() {
  console.log('🧪 Testing APIs...\n');

  try {
    // 1. Test admin login
    console.log('1️⃣ Testing admin login...');
    const adminLoginRes = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: 'admin@literacytest.com',
      password: 'admin123!@#'
    });
    const adminToken = adminLoginRes.data.data.token;
    console.log('   ✅ Admin login successful');
    console.log(`   Token: ${adminToken.substring(0, 20)}...\n`);

    // 2. Test dashboard stats
    console.log('2️⃣ Testing dashboard stats...');
    const statsRes = await axios.get(`${API_URL}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   ✅ Dashboard stats retrieved');
    console.log('   Data:', JSON.stringify(statsRes.data.data, null, 2), '\n');

    // 3. Test recent users
    console.log('3️⃣ Testing recent users...');
    const usersRes = await axios.get(`${API_URL}/api/v1/admin/users/recent?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   ✅ Recent users retrieved');
    console.log('   Users:', JSON.stringify(usersRes.data.data, null, 2), '\n');

    // 4. Test grade stats
    console.log('4️⃣ Testing grade stats...');
    const gradeStatsRes = await axios.get(`${API_URL}/api/v1/admin/stats/by-grade`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   ✅ Grade stats retrieved');
    console.log('   Stats:', JSON.stringify(gradeStatsRes.data.data, null, 2), '\n');

    // 5. Test student login (try both emails)
    console.log('5️⃣ Testing student login (test2@example.com)...');
    try {
      const studentLoginRes1 = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: 'test2@example.com',
        password: 'test1234'
      });
      const studentToken1 = studentLoginRes1.data.data.token;
      console.log('   ✅ Student login successful (test2@example.com)');
      console.log(`   Token: ${studentToken1.substring(0, 20)}...`);
      console.log(`   User:`, JSON.stringify(studentLoginRes1.data.data.user, null, 2), '\n');

      // 6. Test student templates
      console.log('6️⃣ Testing templates for student...');
      const templatesRes = await axios.get(`${API_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${studentToken1}` }
      });
      console.log('   ✅ Templates retrieved');
      console.log('   Templates:', JSON.stringify(templatesRes.data.data, null, 2), '\n');

      // 7. Test student profile
      console.log('7️⃣ Testing student profile...');
      const profileRes = await axios.get(`${API_URL}/api/v1/students/me/profile`, {
        headers: { Authorization: `Bearer ${studentToken1}` }
      });
      console.log('   ✅ Student profile retrieved');
      console.log('   Profile:', JSON.stringify(profileRes.data.data, null, 2), '\n');

    } catch (err: any) {
      console.log('   ❌ test2@example.com login failed:', err.response?.data?.message || err.message);

      // Try second email
      console.log('\n5️⃣b Testing student login (test2@literacy.com)...');
      const studentLoginRes2 = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: 'test2@literacy.com',
        password: 'test1234'
      });
      const studentToken2 = studentLoginRes2.data.data.token;
      console.log('   ✅ Student login successful (test2@literacy.com)');
      console.log(`   Token: ${studentToken2.substring(0, 20)}...`);
      console.log(`   User:`, JSON.stringify(studentLoginRes2.data.data.user, null, 2), '\n');

      // Test templates with second account
      console.log('6️⃣ Testing templates for student...');
      const templatesRes = await axios.get(`${API_URL}/api/v1/templates`, {
        headers: { Authorization: `Bearer ${studentToken2}` }
      });
      console.log('   ✅ Templates retrieved');
      console.log('   Templates:', JSON.stringify(templatesRes.data.data, null, 2), '\n');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error('   Endpoint not found. Check route configuration.');
    }
  }
}

testAPIs();
