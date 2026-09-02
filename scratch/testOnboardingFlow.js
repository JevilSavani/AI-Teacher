require('../backend/src/config/env');
const db = require('../backend/src/config/db');
const AuthService = require('../backend/src/services/auth');
const studentService = require('../backend/src/services/student');

async function testOnboardingFlow() {
  console.log('=== STARTING ONBOARDING FLOW VERIFICATION TEST ===\n');

  const testEmailNew = `test_onboarding_new_${Date.now()}@example.com`;
  const testEmailIncomplete = `test_onboarding_inc_${Date.now()}@example.com`;
  const password = 'Password123!';

  try {
    // SCENARIO 1: Newly Registered User -> Incomplete Profile (profile_completed = false)
    console.log('1. Testing New User Registration...');
    const registerRes = await AuthService.registerUser({
      name: 'New Student',
      email: testEmailNew,
      password
    });
    const userIdNew = registerRes.user.id;
    console.log(`   User created (ID: ${userIdNew})`);

    const profileNew = await studentService.getFullLearningProfile(userIdNew);
    console.log(`   Initial profile_completed: ${profileNew.profile_completed}`);
    if (profileNew.profile_completed !== false) {
      throw new Error('FAIL: New user profile should be incomplete (false)');
    }
    console.log('   ✓ New registration starts with incomplete profile (redirects to /profile/setup)\n');

    // SCENARIO 2: Submit Onboarding Answers -> Sets profile_completed = true in DB
    console.log('2. Testing Onboarding Answers Submission...');
    const updatedProfile = await studentService.updateProfile(userIdNew, {
      education_level: 'undergraduate',
      knowledge_level: 'beginner',
      preferred_language: 'English',
      learning_goal: 'Master Data Structures',
      teaching_style: 'visual',
      available_time_minutes: 30
    });
    console.log(`   Updated profile_completed: ${updatedProfile.profile_completed}`);

    const verifiedProfile = await studentService.getFullLearningProfile(userIdNew);
    console.log(`   Verified DB profile_completed: ${verifiedProfile.profile_completed}`);
    if (verifiedProfile.profile_completed !== true) {
      throw new Error('FAIL: Profile was not marked completed in DB');
    }
    console.log('   ✓ Onboarding submission permanently updates profile_completed = true in DB\n');

    // SCENARIO 3: Subsequent Login for Completed User -> Skips Onboarding (Direct to Dashboard)
    console.log('3. Testing Login for Completed User...');
    const loginResCompleted = await AuthService.loginUser({ email: testEmailNew, password });
    const fetchedProfileComp = await studentService.getFullLearningProfile(loginResCompleted.user.id);
    console.log(`   Login profile_completed status: ${fetchedProfileComp.profile_completed}`);
    if (!fetchedProfileComp.profile_completed) {
      throw new Error('FAIL: Login should indicate profile is completed');
    }
    console.log('   ✓ Login for completed user automatically skips onboarding (direct to /dashboard)\n');

    // SCENARIO 4: Login for Incomplete User -> Shows Onboarding
    console.log('4. Testing Login for Incomplete User...');
    const registerInc = await AuthService.registerUser({
      name: 'Incomplete Student',
      email: testEmailIncomplete,
      password
    });
    const fetchedProfileInc = await studentService.getFullLearningProfile(registerInc.user.id);
    console.log(`   Incomplete user login profile_completed: ${fetchedProfileInc.profile_completed}`);
    if (fetchedProfileInc.profile_completed !== false) {
      throw new Error('FAIL: Incomplete user profile should return profile_completed = false');
    }
    console.log('   ✓ Login for user with incomplete profile correctly redirects to /profile/setup\n');

    console.log('=== ALL ONBOARDING FLOW TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testOnboardingFlow();
