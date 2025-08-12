# GoldGuard Admin Access Instructions

## Admin Access
The admin login has been hidden from the main navigation for security purposes.

### How to Access Admin System:
1. Navigate to: `http://localhost:3000/sys-admin-access`
2. Use the following credentials:
   - **Username**: `goldguard_admin`
   - **Password**: `GG2024@SecureAccess!`
3. You will be redirected to the admin dashboard upon successful login

### Admin Features Available:
- **Admin Dashboard**: `/admin-dashboard` - Overview, statistics, and data visualization
- **Cases Management**: `/cases` - View and manage reported cases with officer assignment
- **Image Analysis**: `/imageanalysis` - AI-powered image analysis tools
- **Officer Management**: `/management` - Add/remove officers, manage assignments
- **Settings**: `/settings` - System configuration and preferences

### Public Pages (No Authentication Required):
- **Home**: `/` - Main landing page
- **Report**: `/report` - Public form for citizens to submit reports
- **Education Hub**: `/education-hub` - Educational resources
- **Contact Us**: `/contactus` - Contact information

### Security Features:
- Admin session expires after 24 hours
- All admin pages are protected with authentication middleware
- Admin login is completely hidden from public navigation
- Secure logout clears all session data

### Officer Management System:
- Officers are stored in localStorage for demo purposes
- Real-time synchronization between management and cases pages
- Officers can be assigned to cases with departments and regions

### Note for Development:
In production, replace localStorage with a secure backend API for user authentication and officer management.
