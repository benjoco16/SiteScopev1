// Comprehensive notification system test
import { q } from "./db.js";
import { transporter } from "./alerts.js";
import { sendPushNotification } from "./firebaseAdmin.js";

async function testNotifications() {
  console.log("🧪 Testing SiteScope Notification Systems...\n");

  try {
    // Test 1: Database Structure
    console.log("1. 📊 Testing Database Structure...");
    
    // Check users table
    const { rows: userColumns } = await q(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'alert_emails'
    `);
    
    if (userColumns.length > 0) {
      console.log(`   ✅ users.alert_emails: ${userColumns[0].data_type}`);
    } else {
      console.log("   ❌ users.alert_emails column missing");
    }

    // Check sites table
    const { rows: siteColumns } = await q(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'sites' AND column_name = 'alert_emails'
    `);
    
    if (siteColumns.length > 0) {
      console.log(`   ✅ sites.alert_emails: ${siteColumns[0].data_type}`);
    } else {
      console.log("   ❌ sites.alert_emails column missing");
    }

    // Check user_tokens table
    const { rows: tokenColumns } = await q(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_tokens'
    `);
    
    if (tokenColumns.length > 0) {
      console.log(`   ✅ user_tokens table exists with ${tokenColumns.length} columns`);
    } else {
      console.log("   ❌ user_tokens table missing");
    }

    // Test 2: Email System
    console.log("\n2. 📧 Testing Email System...");
    try {
      await transporter.verify();
      console.log("   ✅ SMTP connection verified");
    } catch (error) {
      console.log("   ❌ SMTP connection failed:", error.message);
    }

    // Test 3: Get Test User
    console.log("\n3. 👤 Getting Test User...");
    const { rows: users } = await q("SELECT id, email, alert_emails FROM users LIMIT 1");
    
    if (users.length === 0) {
      console.log("   ❌ No users found in database");
      return;
    }
    
    const testUser = users[0];
    console.log(`   ✅ Test user: ${testUser.email} (ID: ${testUser.id})`);
    console.log(`   📧 Alert emails: ${JSON.stringify(testUser.alert_emails)}`);

    // Test 4: Test Email Notification
    console.log("\n4. 📧 Testing Email Notification...");
    try {
      const mailOptions = {
        from: `"SiteScope Test" <${process.env.EMAIL_USER}>`,
        to: testUser.email,
        subject: "SiteScope Test Email",
        text: "This is a test email from SiteScope notification system.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">SiteScope Test Email</h2>
            <p>This is a test email to verify the notification system is working.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="color: #666; font-size: 12px;">
              If you received this email, the notification system is working correctly!
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`   ✅ Test email sent successfully: ${info.messageId}`);
    } catch (error) {
      console.log("   ❌ Test email failed:", error.message);
    }

    // Test 5: Test Push Notifications
    console.log("\n5. 🔔 Testing Push Notifications...");
    const { rows: tokens } = await q("SELECT token FROM user_tokens WHERE user_id=$1", [testUser.id]);
    
    if (tokens.length === 0) {
      console.log("   ⚠️  No FCM tokens found for test user");
      console.log("   💡 Make sure to enable notifications in the frontend");
    } else {
      console.log(`   📱 Found ${tokens.length} FCM token(s) for test user`);
      
      for (const tokenRow of tokens) {
        try {
          const result = await sendPushNotification(
            tokenRow.token,
            "SiteScope Test Notification",
            "This is a test push notification from SiteScope",
            {
              type: 'test_notification',
              timestamp: Date.now().toString()
            }
          );
          
          if (result.success) {
            console.log(`   ✅ Test push notification sent successfully`);
          } else if (result.shouldRemove) {
            console.log(`   🗑️  Invalid token detected, removing from database`);
            await q("DELETE FROM user_tokens WHERE token=$1", [tokenRow.token]);
          } else {
            console.log(`   ❌ Test push notification failed: ${result.error}`);
          }
        } catch (error) {
          console.log(`   ❌ Push notification error: ${error.message}`);
        }
      }
    }

    // Test 6: Test Sites
    console.log("\n6. 🌐 Testing Sites...");
    const { rows: sites } = await q("SELECT id, url, status, alert_emails FROM sites WHERE user_id=$1", [testUser.id]);
    
    if (sites.length === 0) {
      console.log("   ⚠️  No sites found for test user");
      console.log("   💡 Add some sites to monitor in the frontend");
    } else {
      console.log(`   ✅ Found ${sites.length} site(s) for test user`);
      sites.forEach(site => {
        console.log(`      - ${site.url} (${site.status}) - Alert emails: ${JSON.stringify(site.alert_emails)}`);
      });
    }

    console.log("\n🎉 Notification system test completed!");
    console.log("\n📋 Summary:");
    console.log("   - Check your email inbox for the test email");
    console.log("   - Check your browser/device for push notifications");
    console.log("   - If tests failed, check the error messages above");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testNotifications();
