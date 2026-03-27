const fetch = require('node-fetch');

async function testStats() {
  try {
    const response = await fetch('http://localhost:3000/api/public/stats');
    const data = await response.json();
    console.log('Stats:', data);
    if (typeof data.totalMembers === 'number' && typeof data.totalInstructors === 'number') {
      console.log('Verification Success: Counts are numbers');
    } else {
      console.log('Verification Failed: Incorrect data types');
    }
  } catch (error) {
    console.error('Verification Error:', error.message);
  }
}

testStats();
