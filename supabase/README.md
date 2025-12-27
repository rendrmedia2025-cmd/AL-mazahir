# Supabase Database Setup

This directory contains the database schema, migrations, and configuration for the Al Mazahir Trading Dynamic Enhancement Layer.

## Quick Start

1. Run the setup script:
   ```bash
   npm run setup:supabase
   ```

2. Follow the instructions provided by the script to:
   - Create a Supabase project
   - Configure environment variables
   - Run database migrations
   - Set up authentication

## Files Overview

### Migrations
- `migrations/001_initial_schema.sql` - Creates all database tables, types, and indexes
- `migrations/002_rls_policies.sql` - Sets up Row Level Security policies and functions
- `seed.sql` - Inserts initial product categories and availability data

### Configuration
- `config.toml` - Local development configuration for Supabase CLI

## Database Schema

### Tables

1. **product_categories** - Product category definitions
2. **availability_status** - Current availability status for each category
3. **enhanced_leads** - Lead submissions with intelligence metadata
4. **admin_profiles** - Admin user profiles and permissions
5. **audit_log** - Audit trail for all admin actions

### Security

The database uses Row Level Security (RLS) to ensure:
- Public users can only read active product categories and availability
- Public users can submit leads but not read existing ones
- Admin users have full access to manage data
- All admin actions are logged for audit purposes

### Functions

- `is_admin()` - Checks if current user is an admin
- `log_audit_event()` - Logs admin actions for audit trail

## Environment Variables

Required environment variables (add to `.env.local`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Development Workflow

1. **Local Development**: Use the provided configuration to run Supabase locally if needed
2. **Schema Changes**: Add new migrations to the `migrations/` directory
3. **Testing**: Use the seed data for consistent testing
4. **Production**: Apply migrations through the Supabase dashboard

## Security Considerations

- The service role key should never be exposed to client-side code
- RLS policies ensure data isolation between public and admin access
- All admin actions are logged for compliance and debugging
- Authentication is handled through Supabase Auth with Next.js integration

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify environment variables are set correctly
2. **Permission Denied**: Check RLS policies and user authentication
3. **Migration Failures**: Ensure migrations are run in order

### Getting Help

- Check the Supabase documentation: https://supabase.com/docs
- Review the project requirements: `../.kiro/specs/dynamic-enhancement-layer/requirements.md`
- Run the setup script for detailed instructions: `npm run setup:supabase`