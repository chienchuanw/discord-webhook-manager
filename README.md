# Discord Webhook Manager

A comprehensive dashboard for managing Discord Webhooks and automating message delivery. Create and manage multiple webhook configurations, define reusable message templates with variable placeholders, schedule automated messages with flexible scheduling rules, and trigger them via serverless cron jobs.

## Features

- **Webhook Management**: Create, configure, and manage multiple Discord Webhook endpoints
- **Message Templates**: Define reusable message templates with customizable variable placeholders
- **Flexible Scheduling**: Set up recurring message schedules with customizable delivery rules
- **Automated Delivery**: Trigger scheduled messages automatically via serverless cron jobs
- **Test Functionality**: Verify webhook configurations with test message sends
- **Audit Logging**: Complete record of all message deliveries with success/failure status and timestamps
- **Intuitive Dashboard**: Manage all webhooks, templates, and schedules in one place

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: SQLite with MikroORM (embedded, no external database required)
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Testing**: Vitest with Testing Library
- **Scheduling**: Vercel Cron Jobs, node-cron
- **Desktop**: Electron (for macOS local application)

## Project Structure

```text
discord-webhook-manager/
├── app/                   # Next.js App Router pages and API routes
│   ├── api/               # API endpoints for webhooks, templates, schedules
│   ├── webhooks/          # Webhook management pages
│   ├── templates/         # Template management pages
│   └── page.tsx           # Dashboard home page
├── components/            # React components
│   ├── layout/            # Layout components
│   ├── webhook/           # Webhook-related components
│   ├── template/          # Template-related components
│   └── ui/                # shadcn/ui components
├── db/                    # Database layer
│   ├── entities/          # MikroORM entity definitions
│   └── migrations/        # Database migrations
├── electron/              # Electron desktop application
│   ├── main.js            # Electron main process
│   ├── preload.js         # Electron preload script for IPC
│   ├── jsconfig.json      # JavaScript configuration for Electron
│   └── scripts/           # Build scripts
├── services/              # Business logic services
│   ├── webhookService.ts
│   ├── templateService.ts
│   ├── scheduleService.ts
│   └── messageService.ts
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Discord Webhook URL (for testing)

**Note**: No external database installation required. The application uses SQLite, which is embedded and stores data locally in the `./data/` directory.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/discord-webhook-manager.git
   cd discord-webhook-manager
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:

   - `DATABASE_PATH`: SQLite database file path (default: `./data/discord-webhook.db`)
   - `NODE_ENV`: Development or production

4. Start the development server:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3003](http://localhost:3003) in your browser to access the dashboard.

## Available Scripts

### Web Development

- `pnpm dev` - Start development server on port 3003
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:coverage` - Generate test coverage report
- `pnpm lint` - Run ESLint

### Electron Desktop Application

- `pnpm electron:dev` - Start Electron development mode (includes Next.js dev server)
- `pnpm electron:build` - Build Next.js and package Electron application
- `pnpm electron:build:dir` - Build Electron app without creating installers (for testing)

## Development Workflow

### Creating a New Webhook

1. Navigate to the dashboard
2. Click "Add Webhook" button
3. Enter webhook name and Discord Webhook URL
4. Optionally select a message template to apply
5. Save the webhook

### Creating Message Templates

1. Go to the Templates section
2. Create a new template with message content
3. Use variable placeholders (e.g., `{variable_name}`) for dynamic content
4. Save the template

### Setting Up Schedules

1. Select a webhook from the dashboard
2. Create a new schedule
3. Define the schedule rules (frequency, timing)
4. Optionally select a message template
5. Enable the schedule to start automated delivery

### Testing Webhooks

1. Select a webhook
2. Click "Test Send" button
3. Verify the test message appears in Discord
4. Check the audit log for delivery status

## Testing

The project follows Test-Driven Development (TDD) principles. Tests are included for:

- API endpoints
- Service layer business logic
- Template parsing and rendering
- Scheduling logic
- Edge cases and error handling

Run tests with:

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage report
```

## Database

The application uses SQLite as an embedded database. The database file is automatically created and managed:

- **Development**: `./data/discord-webhook.db`
- **Test**: `./data/test.db`
- **Production (Electron)**: `~/Library/Application Support/Discord Webhook Manager/discord-webhook.db`

**Note**: Database schema is automatically synchronized on application startup. No manual migration commands are required.

## Running as Electron Desktop Application

### Prerequisites for Electron

- macOS 10.13 or later
- Node.js 18+

**Note**: No external database installation required. SQLite is embedded in the application.

### Development Mode

Start the Electron application in development mode:

```bash
pnpm electron:dev
```

This command:

1. Starts the Next.js development server on port 3003
2. Launches the Electron application window
3. Enables hot reload for code changes
4. Activates local Cron Jobs for scheduling

### Building for Production

Build the Electron application for macOS:

```bash
pnpm electron:build
```

This command:

1. Builds the Next.js production bundle
2. Packages the application with Electron Builder
3. Creates both `.dmg` and `.zip` installers for both Intel (x64) and Apple Silicon (arm64)

Output files will be in the `dist/` directory:

- `Discord Webhook Manager-x.x.x-arm64.dmg` - DMG installer for Apple Silicon
- `Discord Webhook Manager-x.x.x.dmg` - DMG installer for Intel
- `Discord Webhook Manager-x.x.x-arm64-mac.zip` - ZIP archive for Apple Silicon
- `Discord Webhook Manager-x.x.x-mac.zip` - ZIP archive for Intel
- `mac-arm64/` - Application bundle directory for Apple Silicon
- `mac/` - Application bundle directory for Intel

### Testing the Build

Test the packaged application without creating installers:

```bash
pnpm electron:build:dir
```

The application will be available in `dist/mac-arm64/` or `dist/mac/` directory.

### Installing the Application

#### Method 1: Using DMG Installer (Recommended)

1. Double-click the `.dmg` file to open the installer
2. Drag the "Discord Webhook Manager" application to the Applications folder
3. Wait for the copy process to complete
4. Open Applications folder and double-click "Discord Webhook Manager" to launch

#### Method 2: Direct Launch from Build Directory

For testing purposes, you can launch directly from the build output:

```bash
open ./dist/mac-arm64/Discord\ Webhook\ Manager.app
```

Or for Intel Macs:

```bash
open ./dist/mac/Discord\ Webhook\ Manager.app
```

### Launching the Application

Once installed in the Applications folder:

1. Open **Finder** and navigate to **Applications**
2. Find **Discord Webhook Manager**
3. Double-click to launch

Or use the command line:

```bash
open /Applications/Discord\ Webhook\ Manager.app
```

**Note**: The first launch may take 5-10 seconds as the Next.js server initializes.

### Environment Variables for Electron

The application uses SQLite with automatic database management. Environment variables are optional.

#### For Development

Place `.env.local` in the project root directory (optional):

```bash
DATABASE_PATH=./data/discord-webhook.db
CRON_SCHEDULE=* * * * *
CRON_SECRET=development-secret
```

#### For Installed Application

The application automatically stores data in:

```text
~/Library/Application Support/Discord Webhook Manager/discord-webhook.db
```

Optionally, create `.env.local` for custom configuration:

```bash
mkdir -p ~/Library/Application\ Support/Discord\ Webhook\ Manager
cat > ~/Library/Application\ Support/Discord\ Webhook\ Manager/.env.local << EOF
CRON_SCHEDULE=* * * * *
CRON_SECRET=your-secret-here
EOF
```

**Environment Variables:**

- `DATABASE_PATH`: SQLite database file path (optional, auto-configured)
- `CRON_SCHEDULE`: Cron expression for scheduling (default: `* * * * *` - every minute)
- `CRON_SECRET`: Secret token for cron endpoints (default: `development-secret`)

## Deployment

### Deploy to Vercel (Web)

The easiest way to deploy the web version is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

For detailed instructions, see [Vercel Deployment Documentation](https://vercel.com/docs/frameworks/nextjs).

### Environment Variables for Production (Web)

Ensure these variables are set in your production environment:

- `DATABASE_PATH`: SQLite database file path (optional, defaults to `./data/discord-webhook.db`)
- `NODE_ENV`: Set to "production"

**Note**: For web deployment, SQLite works well for single-instance deployments. For multi-instance or serverless deployments, consider using a cloud database service.

## Troubleshooting

### Electron Application Issues

#### Application closes immediately after launching

**Cause**: Application initialization error or permission issue

**Solution**:

1. Check if the data directory is writable:

   ```bash
   ls -la ~/Library/Application\ Support/Discord\ Webhook\ Manager/
   ```

2. Try launching from terminal to see error messages:

   ```bash
   ./dist/mac-arm64/Discord\ Webhook\ Manager.app/Contents/MacOS/Discord\ Webhook\ Manager
   ```

#### Application fails to start

1. Verify the application bundle is complete:

   ```bash
   ls -la /Applications/Discord\ Webhook\ Manager.app/Contents/
   ```

2. Check for quarantine attribute (macOS security):

   ```bash
   xattr -d com.apple.quarantine /Applications/Discord\ Webhook\ Manager.app
   ```

3. Ensure sufficient disk space for the database

#### Cron Jobs not executing

1. Check `.env.local` for `CRON_SCHEDULE` variable
2. Verify the cron expression is valid
3. Check application logs for errors

#### Debugging from Terminal

To see detailed error messages, launch the application from the terminal:

```bash
open -a "Discord Webhook Manager" --args --verbose
```

Or directly run the executable:

```bash
./dist/mac-arm64/Discord\ Webhook\ Manager.app/Contents/MacOS/Discord\ Webhook\ Manager
```

For more detailed troubleshooting, see [ELECTRON_TESTING.md](./ELECTRON_TESTING.md).

## Contributing

Contributions are welcome! Please ensure:

- All tests pass: `pnpm test:run`
- Code is properly linted: `pnpm lint`
- New features include tests
- Commit messages are clear and descriptive

## License

This project is open source and available under the MIT License.
