# NTHU Voting System v2.0

Anonymous voting system for National Tsing Hua University Student Association.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB 6 with Mongoose 8
- **Authentication**: OAuth (CCXP) + JWT
- **Styling**: Tailwind CSS

## Core Features

### Anonymous Voting

- UUID-based tokens ensure complete anonymity
- Votes cannot be traced to individuals even with database access
- System tracks participation only, not vote content

### Voting Methods

- **choose_all**: Rate each option (support/oppose/neutral)
- **choose_one**: Single choice selection

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm 9+

### Development Setup

```bash
# Clone repository
git clone https://github.com/l7wei/Voting-New.git
cd Voting-New

# Install dependencies
npm install

# Configure environment
cp .env.example .env.development
# Edit .env.development with your MongoDB connection details

# Run development server
npm run dev
```

Access at http://localhost:3000

**Development Mode**: Uses Mock OAuth by default (no real OAuth provider needed)

### Production Deployment

#### Prerequisites

- MongoDB instance (external, not managed by this application)
- OAuth credentials from CCXP
- SSL certificates for HTTPS

#### Deploy with Docker

```bash
# 1. Configure environment variables
cp .env.example .env.production
# Edit .env.production with production values

# 2. Build and run
docker-compose up -d

# 3. View logs
docker-compose logs -f app

# 4. Stop
docker-compose down
```

#### Environment Variables

**Required for Production:**

```env
# MongoDB Connection (use one of these methods)
# Method 1: Full URI (recommended)
MONGODB_URI=mongodb://username:password@host:27017/database?authSource=admin

# Method 2: Individual parameters
MONGO_HOST=your-mongodb-host
MONGO_PORT=27017
MONGO_USERNAME=your-username
MONGO_PASSWORD=your-password
MONGO_NAME=voting_sa

# Security
TOKEN_SECRET=your-strong-random-secret-here
# Use openssl rand -base64 32 to generate

# OAuth (CCXP Production)
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_AUTHORIZE=https://oauth.ccxp.nthu.edu.tw/v1.1/authorize.php
OAUTH_TOKEN_URL=https://oauth.ccxp.nthu.edu.tw/v1.1/token.php
OAUTH_RESOURCE_URL=https://oauth.ccxp.nthu.edu.tw/v1.1/resource.php
OAUTH_CALLBACK_URL=https://your-domain.com/api/auth/callback
OAUTH_SCOPE=userid name inschool uuid

# Application Settings
NODE_ENV=production
PORT=3000
# External hostname for building URLs (without protocol)
APP_HOSTNAME=your-domain.com
```

**Generate strong TOKEN_SECRET:**

```bash
openssl rand -base64 32
```

## Configuration

### Eligible Voters

Copy Example file to create voter list:

```bash
cp data/voterList.csv.example data/voterList.csv
```

Edit `data/voterList.csv`:

```csv
student_id
110000001
110000002
```

### Administrators

Copy Example file to create admin list:

```bash
cp data/adminList.csv.example data/adminList.csv
```

Edit `data/adminList.csv`:

```csv
student_id
110000114
```

## Architecture

### Anonymity Model

**Vote Record (votes collection)** - No voter identification:

```typescript
{
  activity_id: ObjectId,
  rule: 'choose_all' | 'choose_one',
  choose_all?: [{ option_id, remark }],
  choose_one?: ObjectId,
  token: string,  // UUID - anonymous
  created_at: Date
}
```

**Activity Record (activities collection)** - Tracks participation only:

```typescript
{
  name: string,
  rule: 'choose_all' | 'choose_one',
  users: string[],  // Student IDs who voted (not their choices)
  options: ObjectId[],
  open_from: Date,
  open_to: Date
}
```

### Authentication Flow

1. User accesses protected resource → Redirected to login
2. OAuth authorization with CCXP
3. JWT token issued and stored in secure cookie
4. Subsequent requests authenticated via JWT

## API Endpoints

### Authentication

- `GET /api/auth/login` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/check` - Check auth status
- `GET /api/auth/logout` - Logout

### Activities

- `GET /api/activities` - List activities (public)
- `GET /api/activities/:id` - Get activity details (public)
- `POST /api/activities` - Create activity (admin)
- `PUT /api/activities/:id` - Update activity (admin)
- `DELETE /api/activities/:id` - Delete activity (admin)

### Voting

- `POST /api/votes` - Submit vote (authenticated, eligible)
- `GET /api/votes` - List votes (admin, anonymized)

### Statistics

- `GET /api/stats?activity_id=:id` - Get statistics (admin)

## Development

### Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin pages
│   ├── vote/             # Voting pages
│   └── login/            # Login page
├── lib/
│   ├── models/           # Mongoose schemas
│   ├── auth.ts           # Auth utilities
│   ├── oauth.ts          # OAuth client
│   └── db.ts             # Database connection
│   ...
├── components/           # React components
├── data/                 # CSV configuration files
│   ├── voterList.csv     # Eligible voters
│   └── adminList.csv     # Admin list
└── middleware.ts         # Auth middleware
```

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Linting
npm run lint

# Type check
npm run type-check

# Tests
npm test
npm run test:watch
```

### Mock OAuth (Development)

For local development, the system uses Mock OAuth:

1. Navigate to protected route
2. Fill in test data on mock form:
   - Student ID (學號)
   - Name (姓名)
   - In-school status
3. Click "Authorize"

## Security

### Implemented Measures

- ✅ JWT authentication with HttpOnly cookies
- ✅ UUID-based vote anonymization
- ✅ Admin role verification via CSV
- ✅ Voter eligibility validation
- ✅ Time-window enforcement
- ✅ Duplicate vote prevention
- ✅ Secure cookies in production
- ✅ MongoDB authentication

### Privacy Guarantees

- No user database - OAuth data not persisted
- Vote records contain no voter identification
- Activity records track participation only
- UUID tokens are cryptographically random
- Database breach cannot reveal voter-vote mapping

## Production Checklist

Before deploying to production:

- [ ] Set strong `TOKEN_SECRET` (use `openssl rand -base64 32`)
- [ ] Configure production OAuth credentials (CCXP)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure MongoDB with authentication
- [ ] Update `data/voterList.csv` with current student roster
- [ ] Update `data/adminList.csv` with admin student IDs
- [ ] Set `NODE_ENV=production` in environment
- [ ] Enable MongoDB backup automation
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Test OAuth flow end-to-end

## Troubleshooting

**MongoDB connection failed**

- Verify MongoDB is running and accessible
- Check connection credentials in `.env`
- Ensure MongoDB allows connections from app server
- Check firewall rules

**OAuth login fails**

- Verify OAuth credentials are correct
- Ensure `OAUTH_CALLBACK_URL` matches registered redirect URI
- Check OAuth provider is accessible
- Review error logs: `docker-compose logs -f app`

**Vote submission fails**

- Verify student is in `data/voterList.csv`
- Check activity time window is valid
- Confirm student hasn't already voted

## Maintainers

National Tsing Hua University Student Association - IT Department

---

**Security Notice**: This system handles sensitive voting data. Always use HTTPS in production, keep dependencies updated, regularly backup the database, and follow security best practices.
