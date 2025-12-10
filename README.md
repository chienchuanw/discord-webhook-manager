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
- **Database**: PostgreSQL with MikroORM
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
- PostgreSQL database
- Discord Webhook URL (for testing)

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

   - `DATABASE_URL`: PostgreSQL connection string
   - `NODE_ENV`: Development or production

4. Run database migrations:

   ```bash
   pnpm migration:up
   ```

5. Start the development server:

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
- `pnpm migration:create` - Create a new database migration
- `pnpm migration:up` - Run pending migrations
- `pnpm migration:down` - Rollback last migration

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

## Database Migrations

Create a new migration after schema changes:

```bash
pnpm migration:create
```

Apply migrations:

```bash
pnpm migration:up
```

Rollback the last migration:

```bash
pnpm migration:down
```

## Running as Electron Desktop Application

### Prerequisites for Electron

- macOS 10.13 or later
- PostgreSQL database (local or remote)
- Node.js 18+

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

This creates:

- `.app` bundle in `dist/mac/`
- `.dmg` installer in `dist/`

### Testing the Build

Test the packaged application without creating installers:

```bash
pnpm electron:build:dir
```

The application will be available in `dist/mac/` directory.

### Environment Variables for Electron

Ensure these variables are set in `.env.local`:

- `DATABASE_URL`: PostgreSQL connection string
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

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production"

## Troubleshooting

### Electron Application Issues

#### Application fails to start

1. Ensure PostgreSQL is running:

   ```bash
   pg_isready
   ```

2. Verify database exists:

   ```bash
   psql -l | grep db_discord_webhook_manager
   ```

3. Run migrations:

   ```bash
   pnpm migration:up
   ```

#### Cron Jobs not executing

1. Check `.env.local` for `CRON_SCHEDULE` variable
2. Verify the cron expression is valid
3. Check application logs for errors

For more detailed troubleshooting, see [ELECTRON_TESTING.md](./ELECTRON_TESTING.md).

## Contributing

Contributions are welcome! Please ensure:

- All tests pass: `pnpm test:run`
- Code is properly linted: `pnpm lint`
- New features include tests
- Commit messages are clear and descriptive

## License

This project is open source and available under the MIT License.
