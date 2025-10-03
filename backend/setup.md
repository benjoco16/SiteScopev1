# SiteScope Backend Setup

## Security Setup (CRITICAL)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend directory with these required variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sitescope
DB_USER=your_db_user
DB_PASS=your_db_password

# JWT Secret (CRITICAL: Use a strong, unique secret)
JWT_SECRET=your_super_strong_jwt_secret_here_change_this

# Email Configuration (for alerts)
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS in production)
FRONTEND_URL=https://yourdomain.com
```

### 3. Firebase Setup
- Download your Firebase service account key as `serviceAccountKey.json`
- Place it in the backend directory
- **NEVER commit this file to git** (it's already in .gitignore)

### 4. Database Setup
Create the required database tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  image_url TEXT,
  plan VARCHAR(50) DEFAULT 'free',
  contact_number VARCHAR(20),
  alert_emails JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sites table
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'UNKNOWN',
  last_checked TIMESTAMP,
  last_code INTEGER,
  alert_emails TEXT[] DEFAULT '{}', -- Array of alert email addresses
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- Site logs table
CREATE TABLE site_logs (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  checked_at TIMESTAMP DEFAULT NOW(),
  code INTEGER,
  ms INTEGER
);

-- Password resets table
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User tokens for push notifications
CREATE TABLE user_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_site_logs_site_id ON site_logs(site_id);
CREATE INDEX idx_site_logs_checked_at ON site_logs(checked_at);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```

### 5. Start the Server
```bash
npm start
```

## Security Features Implemented

✅ **Environment Validation** - Server won't start without required env vars
✅ **Helmet Security Headers** - Protection against common web vulnerabilities  
✅ **Rate Limiting** - 100 requests per 15 minutes per IP
✅ **CORS Protection** - Only allows requests from configured origins
✅ **Request Size Limits** - Prevents large payload attacks
✅ **Secure Gitignore** - Prevents accidental secret commits

## Next Steps

1. Set up your production environment variables
2. Configure your production domain in FRONTEND_URL
3. Set NODE_ENV=production for production deployment
4. Consider adding input validation middleware
5. Set up proper logging and monitoring
