# SiteScope Notification System Setup & Testing Guide

## ✅ **What's Been Fixed & Implemented**

### **1. Edit Profile Functionality** ✅
- **Fixed**: Complete redesign with professional UI using the new design system
- **Added**: Support for multiple alert email addresses per user
- **Added**: Proper form validation and error handling
- **Added**: Loading states and success feedback

### **2. Notification Systems** ✅
- **Browser Notifications**: Request permission, test notifications
- **Email Notifications**: Always enabled for account email + additional emails
- **Push Notifications**: Firebase Cloud Messaging integration
- **Test Components**: Built-in testing for all notification types

### **3. Backend Enhancements** ✅
- **Profile Update API**: `/auth/update` endpoint with alert emails support
- **Test Notification API**: `/test-notification` endpoint for testing
- **Database Migration**: Added `alert_emails` column to users table
- **Enhanced Logging**: Better error tracking and success messages

### **4. Frontend Components** ✅
- **NotificationSettings**: Comprehensive notification management
- **NotificationTest**: Dashboard component for testing notifications
- **Professional UI**: Consistent design system with proper color palette

## 🧪 **Testing Your Notifications**

### **Step 1: Test Email Notifications**
1. Go to your **Profile** page
2. Click **"Test Email Notification"** in the notification settings
3. Check your email inbox for the test notification
4. **Expected**: You should receive an email with "SiteScope Alert: https://example.com is DOWN"

### **Step 2: Test Browser Notifications**
1. Go to your **Profile** page
2. Click **"Enable Notifications"** if not already enabled
3. Click **"Test Browser Notification"**
4. **Expected**: You should see a browser popup notification

### **Step 3: Test Push Notifications**
1. Ensure you have the SiteScope mobile app installed (if available)
2. Go to your **Profile** page
3. Click **"Test Push Notification"**
4. **Expected**: You should receive a push notification on your mobile device

### **Step 4: Test Website Downtime Alerts**
1. Add a test website to monitor (e.g., `https://httpstat.us/500` - returns 500 error)
2. Wait for the monitoring cycle (runs every 2 minutes)
3. **Expected**: You should receive email notifications when the site goes down

## 🔧 **Configuration Requirements**

### **Backend Environment Variables**
Make sure your `.env` file has these variables:
```env
# Email Configuration (CRITICAL for email notifications)
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sitescope
DB_USER=your_db_user
DB_PASS=your_db_password

# JWT Secret
JWT_SECRET=your_super_strong_jwt_secret_here

# Firebase Configuration (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### **Frontend Environment Variables**
Create a `.env` file in the frontend directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

## 🚀 **Running the Application**

### **Backend**
```bash
cd backend
npm install
npm start
```

### **Frontend**
```bash
cd frontend
npm install
npm start
```

## 📧 **Email Notification Flow**

1. **Website Monitoring**: Backend checks websites every 2 minutes
2. **Status Change Detection**: Only sends alerts when status changes (UP→DOWN, DOWN→UP)
3. **Email Recipients**: 
   - User's account email (always included)
   - Additional alert emails configured in profile
   - Site-specific alert emails (if configured)
4. **Email Content**: Professional HTML email with website URL, status, and timestamp

## 🔔 **Browser Notification Flow**

1. **Permission Request**: User clicks "Enable Notifications" in profile
2. **Token Generation**: Firebase generates a unique token
3. **Token Storage**: Token is saved to backend database
4. **Notification Delivery**: Backend sends notifications via Firebase
5. **Display**: Browser shows popup notification

## 📱 **Mobile Push Notification Flow**

1. **App Installation**: User installs SiteScope mobile app
2. **Token Registration**: App registers for push notifications
3. **Token Sync**: Token is synced with backend
4. **Notification Delivery**: Backend sends push notifications via Firebase
5. **Display**: Mobile device shows push notification

## 🐛 **Troubleshooting**

### **Email Notifications Not Working**
- Check SMTP credentials in backend `.env`
- Verify email server settings
- Check backend logs for SMTP errors
- Test with the "Test Email Notification" button

### **Browser Notifications Not Working**
- Check if browser supports notifications
- Verify notification permission is granted
- Check browser console for errors
- Test with the "Test Browser Notification" button

### **Push Notifications Not Working**
- Verify Firebase configuration
- Check if mobile app is installed
- Verify FCM token is registered
- Test with the "Test Push Notification" button

### **Profile Updates Not Working**
- Check if database migration was run
- Verify backend API endpoint is accessible
- Check browser network tab for API errors
- Ensure user is logged in

## 📊 **Monitoring & Logs**

### **Backend Logs**
- SMTP connection status
- Email sending success/failure
- Push notification delivery status
- Website monitoring results

### **Frontend Console**
- Notification permission status
- Firebase token generation
- API call success/failure
- Error messages and debugging info

## 🎯 **Next Steps**

1. **Test all notification types** using the built-in test buttons
2. **Configure your email settings** in the backend `.env` file
3. **Add test websites** to monitor and verify downtime alerts
4. **Set up additional alert emails** in your profile
5. **Deploy to production** with proper environment variables

Your SiteScope application now has a **complete, professional notification system** that will reliably alert you when your websites go down! 🚀
