# Google OAuth Setup Guide

## Overview

This guide walks through configuring Google OAuth for the Mango Rastreo Chain application using Supabase Auth.

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
- Navigate to https://console.cloud.google.com/
- Select or create a project: "Mango Rastreo Chain"

### 1.2 Enable Google+ API
- Go to **APIs & Services** > **Library**
- Search for "Google+ API"
- Click **Enable**

### 1.3 Create OAuth Consent Screen
- Go to **APIs & Services** > **OAuth consent screen**
- Select **External** user type
- Fill in required fields:
  - **App name**: Mango Rastreo Chain
  - **User support email**: your-email@example.com
  - **Developer contact**: your-email@example.com
- Add scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Add test users (for development):
  - demo@mangorastreo.com
  - your-email@example.com

### 1.4 Create OAuth Client ID
- Go to **APIs & Services** > **Credentials**
- Click **Create Credentials** > **OAuth client ID**
- Application type: **Web application**
- Name: "Mango Rastreo Chain Web Client"
- Authorized JavaScript origins:
  - `http://localhost:5173` (local dev)
  - `https://your-production-domain.com`
- Authorized redirect URIs:
  - `https://your-supabase-project.supabase.co/auth/v1/callback`
  - `http://localhost:5173/auth/callback` (optional for local testing)
- Click **Create**
- **Save the Client ID and Client Secret**

---

## Step 2: Configure Supabase Auth

### 2.1 Go to Supabase Dashboard
- Navigate to https://app.supabase.com/
- Select your project

### 2.2 Enable Google Provider
- Go to **Authentication** > **Providers**
- Find **Google** and toggle it **ON**
- Enter your Google OAuth credentials:
  - **Client ID**: (from Step 1.4)
  - **Client Secret**: (from Step 1.4)
- Click **Save**

### 2.3 Configure Redirect URLs
- Go to **Authentication** > **URL Configuration**
- Add redirect URLs:
  - `http://localhost:5173/auth/callback` (development)
  - `https://your-production-domain.com/auth/callback` (production)

### 2.4 Configure Email Settings (Optional)
- Go to **Authentication** > **Email Templates**
- Customize confirmation and recovery email templates

---

## Step 3: Update Application Code

### 3.1 Environment Variables
Ensure your `.env.local` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3.2 Auth Configuration (Already Implemented)
The application already has Google OAuth configured in:
- `src/integrations/supabase/client.ts` — Supabase client
- `src/pages/Index.tsx` — Login page with Google button

### 3.3 Sign In with Google
```typescript
import { supabase } from "@/integrations/supabase/client";

const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
  }
};
```

---

## Step 4: Create Demo Account

### 4.1 Create Google Account
- Go to https://accounts.google.com/signup
- Create account with:
  - **Email**: demo@mangorastreo.com (or use Gmail)
  - **Name**: Demo User
  - **Password**: (secure password)

### 4.2 Add to OAuth Consent Test Users
- Go back to Google Cloud Console
- **OAuth consent screen** > **Test users**
- Add: demo@mangorastreo.com
- Click **Save**

### 4.3 Sign In and Assign Role
1. Navigate to your application: `http://localhost:5173`
2. Click "Sign in with Google"
3. Authenticate with demo@mangorastreo.com
4. After first sign-in, assign role via SQL:

```sql
-- Get the user ID
SELECT id, email FROM auth.users WHERE email = 'demo@mangorastreo.com';

-- Assign role
INSERT INTO user_roles (user_id, role, organization_id, created_by)
VALUES (
  'user-id-from-above',
  'compliance_lead',
  '00000000-0000-0000-0000-000000000001',
  'system'
);
```

---

## Step 5: Test the Flow

### 5.1 Test Sign In
1. Go to `http://localhost:5173`
2. Click "Sign in with Google"
3. Select demo@mangorastreo.com
4. Verify redirect to `/consignments`

### 5.2 Test Role Permissions
1. Navigate to a consignment
2. Verify "Generate Pack" button is visible (compliance_lead permission)
3. Try uploading evidence
4. Check audit trail

### 5.3 Test Sign Out
1. Click user menu
2. Click "Sign Out"
3. Verify redirect to login page

---

## Step 6: Production Deployment

### 6.1 Update Google OAuth Credentials
- Add production domain to authorized origins
- Add production callback URL

### 6.2 Update Supabase Redirect URLs
- Add production callback URL

### 6.3 Environment Variables
Set production environment variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 6.4 Deploy
```bash
npm run build
# Deploy to Netlify/Vercel/etc.
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: Redirect URI not authorized in Google Console
- **Fix**: Add the exact redirect URI to Google OAuth Client

### Error: "Access blocked: This app's request is invalid"
- **Cause**: OAuth consent screen not configured
- **Fix**: Complete OAuth consent screen setup in Google Console

### Error: "User not found in database"
- **Cause**: User signed in but no role assigned
- **Fix**: Run SQL to assign role (see Step 4.3)

### Error: "Invalid redirect URL"
- **Cause**: Redirect URL not configured in Supabase
- **Fix**: Add redirect URL in Supabase Dashboard > Authentication > URL Configuration

---

## Security Best Practices

1. **Never commit OAuth secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Restrict OAuth scopes** to minimum required (email, profile)
4. **Enable RLS policies** on all tables (already implemented in P1.4)
5. **Rotate secrets regularly** in production
6. **Monitor auth logs** in Supabase Dashboard
7. **Implement rate limiting** for auth endpoints
8. **Use HTTPS only** in production

---

## Demo Account Credentials

**For Testing Only**:
- Email: demo@mangorastreo.com
- Role: compliance_lead
- Organization: Mango Export Demo Org
- Permissions: Create consignments, upload evidence, resolve exceptions, generate packs

**Do not use in production.**

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
