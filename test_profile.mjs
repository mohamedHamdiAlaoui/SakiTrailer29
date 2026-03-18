import { DatabaseSync } from 'node:sqlite';
import fetch from 'node-fetch'; // Standard fetch is available in modern Node.js versions, but we can also use built-in fetch if Node >= 18

(async () => {
  const db = new DatabaseSync('./server/data/sakitrailer29.sqlite');
  
  // Find an admin user to test with, or any user
  const user = db.prepare("SELECT * FROM users LIMIT 1").get();
  if (!user) {
    console.error("No users found to test.");
    process.exit(1);
  }

  // Generate a test token and save it to the DB session table
  const testToken = `test-token-${Date.now()}`;
  db.prepare(`
    INSERT INTO sessions (token, user_id, created_at, last_used_at)
    VALUES (?, ?, ?, ?)
  `).run(testToken, user.id, new Date().toISOString(), new Date().toISOString());

  console.log(`Created test session for user ${user.email} (ID: ${user.id})`);

  // Fire PUT request to the profile endpoint
  const newName = `Tested Name ${Math.floor(Math.random() * 1000)}`;
  const newCompany = `New Company ${Math.floor(Math.random() * 1000)}`;

  try {
    const res = await fetch('http://localhost:4000/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        fullName: newName,
        companyName: newCompany
      })
    });

    const data = await res.json();
    console.log("Response:", data);

    if (data.success && data.user.fullName === newName && data.user.companyName === newCompany) {
      console.log("SUCCESS! The database successfully saved the new profile data.");
      
      // Verify directly in DB
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      console.log(`DB Verification: Name=${updatedUser.full_name}, Company=${updatedUser.company_name}`);
      if (updatedUser.company_name === newCompany) {
          console.log("Database write is fully verified.");
      } else {
          console.log("Database write failed verification.");
      }
    } else {
      console.error("FAILED to verify response matches.");
    }
  } catch (err) {
    console.error("Failed to fetch:", err.message);
  } finally {
    // Cleanup the test session
    db.prepare("DELETE FROM sessions WHERE token = ?").run(testToken);
  }
})();
