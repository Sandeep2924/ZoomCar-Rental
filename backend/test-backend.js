const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

console.log("=========================================");
console.log("🛡️ RUNNING BACKEND SECURITY TESTS...");
console.log("=========================================\n");

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`✅ SUCCESS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAILURE: ${msg}`);
      failed++;
    }
  };

  // Test 1: Password Hashing Integrity
  console.log("Running Test 1: Password Hashing Verification...");
  try {
    const rawPassword = "StrongPassword@1234";
    const hash = await bcrypt.hash(rawPassword, 10);
    assert(hash !== rawPassword, "Bcrypt successfully hashed the password.");
    assert(hash.startsWith("$2a$") || hash.startsWith("$2b$"), "Bcrypt hash signature is valid.");
    
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert(isMatch === true, "Bcrypt verified correct password matching.");
    
    const isNotMatch = await bcrypt.compare("WrongPassword", hash);
    assert(isNotMatch === false, "Bcrypt successfully rejected incorrect password.");
  } catch (err) {
    assert(false, `Test 1 failed with error: ${err.message}`);
  }
  console.log("");

  // Test 2: JWT Session Token Verification
  console.log("Running Test 2: JWT Issuance and Parsing...");
  try {
    const secret = "test_jwt_secret_key_12345!@#";
    const userId = 42;
    const token = jwt.sign({ userId }, secret, { expiresIn: "1h" });
    assert(typeof token === "string", "JWT token successfully signed.");
    
    const decoded = jwt.verify(token, secret);
    assert(decoded.userId === userId, "JWT token successfully decoded and userId matches.");
    
    try {
      jwt.verify(token, "wrong_secret");
      assert(false, "JWT verified with incorrect secret (should have failed).");
    } catch (jwtErr) {
      assert(true, "JWT rejected invalid secret key signature.");
    }
  } catch (err) {
    assert(false, `Test 2 failed with error: ${err.message}`);
  }
  console.log("");

  // Test 3: Password Complexity Policies Mock Check
  console.log("Running Test 3: Password Complexity Rules...");
  const validatePassword = (pass) => {
    if (pass.length < 8) return false;
    if (!/[a-z]/.test(pass)) return false;
    if (!/[A-Z]/.test(pass)) return false;
    if (!/[0-9]/.test(pass)) return false;
    if (!/[\W_]/.test(pass)) return false;
    return true;
  };

  assert(validatePassword("password") === false, "Rejected all-lowercase weak password.");
  assert(validatePassword("Password123") === false, "Rejected password missing special character.");
  assert(validatePassword("PASSWORD@123") === false, "Rejected password missing lowercase letter.");
  assert(validatePassword("Pass@1") === false, "Rejected password too short (< 8 chars).");
  assert(validatePassword("SecurePass@123") === true, "Accepted password complying with all complexity policies.");
  console.log("");

  // Test 4: Account Lockout Timing Logic
  console.log("Running Test 4: Brute Force Account Lockout Calculations...");
  const mockUser = {
    login_attempts: 4,
    lock_until: null
  };

  // Simulate fifth failed attempt
  mockUser.login_attempts += 1;
  if (mockUser.login_attempts >= 5) {
    mockUser.lock_until = new Date(Date.now() + 15 * 60 * 1000);
  }

  assert(mockUser.login_attempts === 5, "Login attempts correctly incremented to 5.");
  assert(mockUser.lock_until !== null, "Lockout timestamp was created.");
  assert(mockUser.lock_until > new Date(), "Lockout timestamp is set in the future.");
  console.log("");

  // Summary
  console.log("=========================================");
  console.log(`TEST RUN COMPLETED. Passed: ${passed}, Failed: ${failed}`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
