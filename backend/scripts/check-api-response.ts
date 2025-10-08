import axios from 'axios';

async function checkAPIResponse() {
  try {
    // Login first to get token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'test2@literacy.com',
      password: 'deep1234'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    // Get session result
    const resultResponse = await axios.get(
      'http://localhost:3000/api/v1/sessions/d6131960-38ef-4e72-a616-7b7184f5f43c/result',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Find answers with feedback
    const answersWithFeedback = resultResponse.data.data.answers.filter(
      (a: any) => a.feedback
    );

    console.log('\n=== Answers with Feedback ===');
    answersWithFeedback.forEach((answer: any, idx: number) => {
      console.log(`\n--- Answer ${idx + 1} ---`);
      console.log('Question Number:', answer.questionNumber);
      console.log('Question Text:', answer.question.questionText);
      console.log('Question Type:', answer.question.questionType);
      console.log('Question Text Length:', answer.question.questionText?.length || 0);
      console.log('Question Text exists:', !!answer.question.questionText);
      console.log('Student Answer:', answer.studentAnswer);
      console.log('Feedback:', answer.feedback?.substring(0, 100));
    });

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkAPIResponse();
