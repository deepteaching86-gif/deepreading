import axios from 'axios';

async function testSave() {
  try {
    // First login
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'student1@test.com',
      password: 'password123'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('Logged in successfully');
    
    // Get active session
    const sessionsRes = await axios.get('http://localhost:3000/api/v1/sessions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const activeSessions = sessionsRes.data.data.filter((s: any) => s.status === 'in_progress');
    
    if (activeSessions.length === 0) {
      console.log('No active sessions found');
      return;
    }
    
    const sessionId = activeSessions[0].id;
    console.log('Session ID:', sessionId);
    
    // Try to save answers
    const saveRes = await axios.post(
      `http://localhost:3000/api/v1/sessions/${sessionId}/answers`,
      {
        answers: [
          { questionId: 'test-id-1', answer: 'Test answer 1' },
          { questionId: 'test-id-2', answer: 'Test answer 2' }
        ]
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 150000
      }
    );
    
    console.log('Save response:', saveRes.data);
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
  }
}

testSave();
