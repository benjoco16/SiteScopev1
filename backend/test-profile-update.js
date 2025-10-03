// Test script to verify profile update functionality
import { q } from "./db.js";

async function testProfileUpdate() {
  try {
    console.log("Testing profile update functionality...");
    
    // Test 1: Check if users table has alert_emails column
    console.log("\n1. Checking users table structure...");
    const { rows: columns } = await q(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'alert_emails'
    `);
    
    if (columns.length > 0) {
      console.log("✅ alert_emails column exists:", columns[0]);
    } else {
      console.log("❌ alert_emails column does not exist");
    }
    
    // Test 2: Check if we can insert/update alert_emails
    console.log("\n2. Testing alert_emails update...");
    try {
      const testUpdate = await q(`
        UPDATE users 
        SET alert_emails = $1 
        WHERE id = (SELECT id FROM users LIMIT 1)
        RETURNING id, alert_emails
      `, ['["test@example.com"]']);
      
      if (testUpdate.rows.length > 0) {
        console.log("✅ alert_emails update successful:", testUpdate.rows[0]);
      } else {
        console.log("❌ No users found to test with");
      }
    } catch (error) {
      console.log("❌ alert_emails update failed:", error.message);
    }
    
    // Test 3: Check users table structure
    console.log("\n3. Full users table structure:");
    const { rows: allColumns } = await q(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    allColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testProfileUpdate();
