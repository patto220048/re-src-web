# EditerLor — Professional Email Templates (English)

These templates are designed with a **Stark Monochrome Gold** aesthetic to match the EditerLor platform. They are optimized for Supabase Auth and Mailjet SMTP.

---

## 1. Confirm Signup
**Subject:** Welcome to EditerLor — Confirm your email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EditerLor</title>
  <style>
    body { background-color: #0A0A0A; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; color: #FFFFFF; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #0A0A0A; padding-bottom: 60px; }
    .main { background-color: #141414; margin: 0 auto; width: 100%; max-width: 600px; border: 1px solid #333333; border-collapse: collapse; }
    .header { padding: 40px 0; text-align: center; }
    .content { padding: 0 50px 50px 50px; }
    .title { font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; line-height: 1.7; color: #A0A0A0; margin-bottom: 30px; text-align: center; }
    .btn-wrap { text-align: center; padding: 20px 0; }
    .button { background-color: #FACB11; color: #000000 !important; padding: 18px 40px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; font-size: 14px; }
    .footer { text-align: center; padding: 30px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 2px; }
    .divider { border-top: 1px solid #333333; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://your-domain.com/logo.png" alt="EditerLor" width="140" style="display: block; margin: 0 auto;">
    </div>
    <table class="main">
      <tr>
        <td class="content">
          <h1 class="title">Welcome Abroad</h1>
          <p class="text">
            Thank you for joining EditerLor. You are one step away from accessing premium resources for video editors. Please confirm your email address to activate your account.
          </p>
          <div class="btn-wrap">
            <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
          </div>
          <div class="divider"></div>
          <p class="text" style="font-size: 13px; margin-bottom: 0;">
            If you didn't sign up for an EditerLor account, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
    <div class="footer">
      &copy; EditerLor Team. Inspired by excellence.
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password
**Subject:** Reset your password for EditerLor

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body { background-color: #0A0A0A; font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #FFFFFF; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #0A0A0A; padding-bottom: 60px; }
    .main { background-color: #141414; margin: 0 auto; width: 100%; max-width: 600px; border: 1px solid #333333; border-collapse: collapse; }
    .header { padding: 40px 0; text-align: center; }
    .content { padding: 0 50px 50px 50px; }
    .title { font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; line-height: 1.7; color: #A0A0A0; margin-bottom: 30px; text-align: center; }
    .btn-wrap { text-align: center; padding: 20px 0; }
    .button { background-color: #FACB11; color: #000000 !important; padding: 18px 40px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; font-size: 14px; }
    .footer { text-align: center; padding: 30px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 2px; }
    .divider { border-top: 1px solid #333333; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://your-domain.com/logo.png" alt="EditerLor" width="140" style="display: block; margin: 0 auto;">
    </div>
    <table class="main">
      <tr>
        <td class="content">
          <h1 class="title">Secure Your Account</h1>
          <p class="text">
            We received a request to reset your password. If this was you, click the button below to set a new one. Security is our priority.
          </p>
          <div class="btn-wrap">
            <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
          </div>
          <div class="divider"></div>
          <p class="text" style="font-size: 13px; margin-bottom: 0;">
            This link will expire in 60 minutes. If you didn't request a reset, please ignore this email.
          </p>
        </td>
      </tr>
    </table>
    <div class="footer">
      &copy; EditerLor Team. Built for Creators.
    </div>
  </div>
</body>
</html>
```

---

## 3. Magic Link
**Subject:** Magic Login Link — EditerLor

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Link</title>
  <style>
    body { background-color: #0A0A0A; font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #FFFFFF; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #0A0A0A; padding-bottom: 60px; }
    .main { background-color: #141414; margin: 0 auto; width: 100%; max-width: 600px; border: 1px solid #333333; border-collapse: collapse; }
    .header { padding: 40px 0; text-align: center; }
    .content { padding: 0 50px 50px 50px; }
    .title { font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; line-height: 1.7; color: #A0A0A0; margin-bottom: 30px; text-align: center; }
    .btn-wrap { text-align: center; padding: 20px 0; }
    .button { background-color: #FACB11; color: #000000 !important; padding: 18px 40px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; font-size: 14px; }
    .footer { text-align: center; padding: 30px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://your-domain.com/logo.png" alt="EditerLor" width="140" style="display: block; margin: 0 auto;">
    </div>
    <table class="main">
      <tr>
        <td class="content">
          <h1 class="title">Fast Login</h1>
          <p class="text">
            No password? No problem. Use this magic link to sign in to your EditerLor account instantly.
          </p>
          <div class="btn-wrap">
            <a href="{{ .ConfirmationURL }}" class="button">Log In Now</a>
          </div>
          <p class="text" style="font-size: 13px; color: #666666;">
            If you didn't request this link, just delete this email.
          </p>
        </td>
      </tr>
    </table>
    <div class="footer">
      &copy; EditerLor Team. Stay Creative.
    </div>
  </div>
</body>
</html>
```

---

## 4. Password Changed Notification
**Subject:** Security Alert: Your password has been changed

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
  <style>
    body { background-color: #0A0A0A; font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #FFFFFF; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #0A0A0A; padding-bottom: 60px; }
    .main { background-color: #141414; margin: 0 auto; width: 100%; max-width: 600px; border: 1px solid #333333; border-collapse: collapse; }
    .header { padding: 40px 0; text-align: center; }
    .content { padding: 0 50px 50px 50px; }
    .title { font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 24px; text-align: center; }
    .text { font-size: 16px; line-height: 1.7; color: #A0A0A0; margin-bottom: 30px; text-align: center; }
    .footer { text-align: center; padding: 30px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 2px; }
    .status-badge { background-color: #FACB11; color: #000000; padding: 10px 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; display: inline-block; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://your-domain.com/logo.png" alt="EditerLor" width="140" style="display: block; margin: 0 auto;">
    </div>
    <table class="main">
      <tr>
        <td class="content" style="text-align: center;">
          <div style="padding-top: 40px;">
            <div class="status-badge">Success</div>
          </div>
          <h1 class="title">Password Changed</h1>
          <p class="text">
            This is a confirmation that your EditerLor account password has been successfully changed.
          </p>
          <p class="text" style="font-size: 14px; color: #666666;">
            If you did not perform this action, please contact our support team immediately or secure your account.
          </p>
          <div style="border-top: 1px solid #333333; margin: 30px 0;"></div>
          <p class="text" style="font-size: 12px;">
            Action performed on: {{ .Timestamp }}
          </p>
        </td>
      </tr>
    </table>
    <div class="footer">
      &copy; EditerLor Team. Security First.
    </div>
  </div>
</body>
</html>
```
