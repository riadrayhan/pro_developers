# JobPortal - Client & Developer Platform

A complete job marketplace website where **Developers** can find and apply for jobs while **Clients** can post job opportunities.

## Features

### Developer Features
- **Registration** with:
  - Profile Image
  - Full Name
  - Email Address
  - WhatsApp Phone Number
  - Job ID Card Image
  - NID Card Image
  - Password Protection
  
- **Login** with Phone Number & Password
- **Homepage** to browse client job postings
- **Love/React Button** to show interest in jobs (with counter)
- **Logout** functionality

### Client Features
- **Registration** with:
  - Company Logo/Image
  - Company/Your Name
  - Email Address
  - WhatsApp Number
  - Password Protection

- **Login** with Phone Number & Password
- **Post Jobs** with:
  - Job Title
  - Job Description
  - WhatsApp Contact Number
  - Budget Amount
  - Time Duration (Optional)
  
- **View Interests** - See how many developers are interested in each job
- **Logout** functionality

### Admin Features
- **Hidden Login**: Phone: `admin`, Password: `@55555`
- **User Approval System**:
  - View pending developer and client registrations
  - Approve or reject users
  - Only approved users can access the platform
- **User Management**:
  - View user details (avatar, name, email)
  - Accept/Reject registrations

### Security & Data Management
- **Password Encryption** - Passwords are encoded for storage
- **Session Management** - User sessions are maintained
- **Admin Approval** - All new users require admin approval before access
- **Data Persistence** - All data stored in browser localStorage
- **File to Base64** - Images are converted to Base64 for storage

### Additional Features
- **Forgot Password** - Email-based password recovery
- **Responsive Design** - Works on all devices
- **Beautiful UI** - Modern Bootstrap 5 interface with custom styling
- **Role-Based Access** - Different experiences for developers, clients, and admins

## File Structure

```
/public/
  ├── index.html       # Main HTML file (single page app)
  ├── app.js           # JavaScript application logic
  └── README.md        # This file
```

## How to Use

### 1. **First Time Setup**
- Open `index.html` in your browser
- Choose your role: **Developer** or **Client**

### 2. **Developer Journey**
1. Click "Developer" on the homepage
2. Fill the registration form:
   - Select your profile image
   - Enter full name, email, phone
   - Upload Job ID and NID card images
   - Set password
3. Submit and wait for admin approval
4. Once approved, login with phone number and password
5. Browse available jobs
6. Click heart icon to show interest in a job

### 3. **Client Journey**
1. Click "Client" on the homepage
2. Fill the registration form:
   - Select company logo
   - Enter company name, email, phone
   - Set password
3. Submit and wait for admin approval
4. Once approved, login with phone number and password
5. Click "Post New Job" button
6. Fill job details and post
7. View interest count on your posted jobs

### 4. **Admin Approval**
1. Go to login page
2. Enter Phone: `admin`
3. Enter Password: `@55555`
4. View all pending registrations
5. Click "Approve" to accept or "Reject" to decline
6. Users can only login after approval

## Data Storage

### Local Storage Keys
- `developers` - Array of developer registrations
- `clients` - Array of client registrations
- `jobs` - Array of posted jobs
- `approvals` - Admin approval queue
- `likes` - Job interest tracking

### Session Storage
- `currentUser` - Currently logged-in user data

### Data Structure

**Developer Object:**
```javascript
{
  id: "timestamp",
  role: "developer",
  name: "Full Name",
  email: "email@example.com",
  phone: "+1234567890",
  image: "base64_image_data",
  jobID: "base64_image_data",
  nid: "base64_image_data",
  password: "encoded_password",
  approved: false,
  registeredAt: "ISO_date"
}
```

**Job Object:**
```javascript
{
  id: "timestamp",
  clientId: "client_user_id",
  clientName: "Client Name",
  clientImage: "base64_image",
  title: "Job Title",
  details: "Job description",
  phone: "+1234567890",
  budget: 5000,
  duration: "2 weeks",
  likes: 0,
  postedAt: "ISO_date"
}
```

## Features in Detail

### 1. **Registration Process**
- All fields are required
- Images are converted to Base64 for storage
- Passwords must match confirm password
- Minimum password length: 6 characters
- User is added to approval queue

### 2. **Login Process**
- Phone number is used as username
- Password must match registered password
- Cannot login if not approved by admin
- Maintains session for current user

### 3. **Job Posting**
- Title, description, budget are required
- Phone and duration are optional for clients
- Jobs are immediately visible to developers
- Shows current developer interest count

### 4. **Love/Interest System**
- Developers can like jobs they're interested in
- Heart icon changes color when liked
- Count updates in real-time
- Clients see total interest count

### 5. **Admin Approval**
- New registrations go to pending queue
- Admin can approve or reject
- Approved users get access to platform
- Rejected users are removed from system

## Testing

### Test Account 1 (Developer)
1. Register as Developer
2. Login as Admin (phone: admin, password: @55555)
3. Approve the developer
4. Login as Developer and post jobs

### Test Account 2 (Client)
1. Register as Client
2. Post jobs as client
3. See developer interests

### Test Admin
- Phone: `admin`
- Password: `@55555`
- View all pending approvals
- Approve/reject users

## Important Notes

### Password Security
- Passwords use basic Base64 encoding for demo purposes
- For production: Use proper encryption libraries (bcryptjs, argon2, etc.)
- Never store passwords in localStorage in production

### Data Persistence
- All data is stored in browser's localStorage
- Data persists even after browser restart
- Clearing browser data will delete all information
- For production: Use backend database (PostgreSQL, MongoDB, etc.)

### Image Storage
- Images are converted to Base64 strings
- Large images may exceed localStorage limits
- For production: Use cloud storage (AWS S3, Google Drive, etc.)

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Limitations (Current Version)
- Single browser session
- No backend server
- No email integration
- No real password reset
- All data lost if localStorage cleared
- No multi-user simultaneous access

## Future Enhancements

For production version, consider:
1. **Backend Server** (Node.js, Python, PHP)
2. **Database** (PostgreSQL, MongoDB)
3. **Email Service** (SendGrid, Mailgun)
4. **File Storage** (AWS S3, Google Drive API, Azure Blob)
5. **Payment Gateway** (Stripe, PayPal)
6. **Real-time Notifications** (WebSockets, Pusher)
7. **User Messaging** (Chat system)
8. **Reviews & Ratings** (Star ratings, feedback)
9. **Mobile App** (React Native, Flutter)
10. **Analytics** (Google Analytics, Mixpanel)

## Contact & Support

For issues or questions, please refer to the documentation in this folder.

---

**Built with:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
**Last Updated:** 2024
**Version:** 1.0
