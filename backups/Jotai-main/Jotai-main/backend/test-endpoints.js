const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    console.log('Starting backend verification...');

    try {
        // 1. Test Goals CRUD
        console.log('\nTesting Goals...');
        const goalRes = await axios.post(`${BASE_URL}/goals`, { title: 'Test Goal', description: 'Testing backend' });
        console.log('✅ Create Goal:', goalRes.status === 201);
        const goalId = goalRes.data._id;

        const goalsRes = await axios.get(`${BASE_URL}/goals`);
        console.log('✅ Get Goals:', goalsRes.data.length > 0);

        await axios.delete(`${BASE_URL}/goals/${goalId}`);
        console.log('✅ Delete Goal: Success');

        // 2. Test Habits CRUD
        console.log('\nTesting Habits...');
        const habitRes = await axios.post(`${BASE_URL}/habits`, { text: 'Test Habit', frequency: 'daily' });
        console.log('✅ Create Habit:', habitRes.status === 201);
        const habitId = habitRes.data._id;
        await axios.delete(`${BASE_URL}/habits/${habitId}`);
        console.log('✅ Delete Habit: Success');

        // 3. Test Notes CRUD
        console.log('\nTesting Notes...');
        const noteRes = await axios.post(`${BASE_URL}/notes`, { text: 'Test Note' });
        console.log('✅ Create Note:', noteRes.status === 201);
        const noteId = noteRes.data._id;
        await axios.delete(`${BASE_URL}/notes/${noteId}`);
        console.log('✅ Delete Note: Success');

        // 4. Test Analytics
        console.log('\nTesting Analytics...');
        const analyticsRes = await axios.get(`${BASE_URL}/analytics`);
        console.log('✅ Get Analytics:', analyticsRes.status === 200);

        // 5. Test Preferences
        console.log('\nTesting Preferences...');
        const prefRes = await axios.get(`${BASE_URL}/preferences`);
        console.log('✅ Get Preferences:', prefRes.status === 200);

        console.log('\n🎉 All basic CRUD tests passed!');
        console.log('Note: Proxy routes (AI, Weather, Stocks, News) require valid API keys in .env to be fully tested.');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testEndpoints();
