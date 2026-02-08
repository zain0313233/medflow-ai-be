/**
 * Test Google Calendar Integration
 * 
 * Run: node test-google-calendar.js
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleCalendarSetup() {
  console.log('\n🧪 Testing Google Calendar Setup...\n');

  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceAccountEmail) {
    console.log('❌ GOOGLE_SERVICE_ACCOUNT_EMAIL not found in .env');
    return;
  }
  console.log('✅ Service Account Email:', serviceAccountEmail);

  if (!privateKey) {
    console.log('❌ GOOGLE_PRIVATE_KEY not found in .env');
    return;
  }
  console.log('✅ Private Key found (length:', privateKey.length, 'chars)');

  // Test authentication
  console.log('\n2️⃣ Testing authentication...');
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const authClient = await auth.getClient();
    console.log('✅ Authentication successful!');

    // Test Calendar API access
    console.log('\n3️⃣ Testing Calendar API access...');
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Try to list calendars (this will fail if Calendar API is not enabled)
    const response = await calendar.calendarList.list();
    console.log('✅ Calendar API is enabled and accessible!');
    console.log('📅 Found', response.data.items?.length || 0, 'calendars');

    console.log('\n✅ All tests passed! Google Calendar integration is ready.');
    console.log('\n📋 Next steps:');
    console.log('   1. Doctors need to share their calendars with:', serviceAccountEmail);
    console.log('   2. Update doctor profiles with googleCalendarId and googleCalendarEnabled');
    console.log('   3. Test booking an appointment');

  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('Calendar API has not been used')) {
      console.log('\n⚠️  Google Calendar API is not enabled!');
      console.log('   Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
      console.log('   Click "Enable" button');
    }
  }
}

testGoogleCalendarSetup();
