# Database Backup & Restore Procedures

## Overview

Amatic.ai uses **Supabase (PostgreSQL)** as its primary database. This document outlines backup strategies, restoration procedures, and disaster recovery plans.

---

## 🔄 Automatic Backups (Supabase)

### Current Configuration

Supabase provides automatic daily backups for all projects:

- **Backup Frequency**: Daily (automatic)
- **Retention Period**: 
  - Free tier: 7 days
  - Pro tier: 30 days
  - Team/Enterprise: Customizable (up to 90 days)
- **Backup Type**: Full database snapshots
- **Storage Location**: Supabase managed storage (encrypted)

### Accessing Automatic Backups

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Database** > **Backups**
4. View available backup points

---

## 📥 Manual Backup Procedures

### Option 1: Supabase Dashboard (Recommended for Quick Backups)

```bash
# 1. Go to Supabase Dashboard
# 2. Database > Backups > Create Backup
# 3. Name your backup (e.g., "pre-migration-2025-01-07")
# 4. Wait for completion (usually 1-5 minutes)
```

### Option 2: pg_dump (Command Line)

```bash
# Install PostgreSQL client tools first
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Get connection string from Supabase Dashboard > Settings > Database

# Full database backup
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables only
pg_dump "postgresql://..." \
  --table=users \
  --table=subscriptions \
  --table=referrals \
  --table=payouts \
  > critical_tables_backup.sql

# Compressed backup (saves space)
pg_dump "postgresql://..." | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Option 3: Automated Backup Script

Create a file `scripts/backup-database.sh`:

```bash
#!/bin/bash

# Load environment variables
source .env.local

# Configuration
BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/amatic_backup_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
pg_dump "$SUPABASE_CONNECTION_STRING" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    
    # Calculate file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📦 Backup size: $SIZE"
    
    # Delete backups older than 30 days
    find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
    echo "🗑️  Cleaned up old backups (>30 days)"
else
    echo "❌ Backup failed!"
    exit 1
fi
```

Make it executable:
```bash
chmod +x scripts/backup-database.sh
```

Run it:
```bash
./scripts/backup-database.sh
```

---

## 📤 Restore Procedures

### Option 1: Restore from Supabase Automatic Backup

1. Go to Supabase Dashboard > Database > Backups
2. Find the backup point you want to restore
3. Click **"Restore"**
4. **WARNING**: This will overwrite your current database
5. Confirm restoration
6. Wait for completion (5-15 minutes)
7. Verify data integrity

### Option 2: Restore from pg_dump File

```bash
# Restore from uncompressed backup
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  < backup_20250107_120000.sql

# Restore from compressed backup
gunzip -c backup_20250107_120000.sql.gz | \
  psql "postgresql://..."

# Restore specific tables only
psql "postgresql://..." \
  < critical_tables_backup.sql
```

### Option 3: Point-in-Time Recovery (PITR)

**Available on**: Supabase Pro tier and above

1. Go to Supabase Dashboard > Database > Backups
2. Click **"Point in Time Recovery"**
3. Select the exact timestamp to restore to
4. Confirm restoration
5. Wait for completion

**Use Cases**:
- Accidental data deletion
- Corrupted data from bad migration
- Need to recover to specific moment before incident

---

## 🚨 Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Recovery Time Objective (RTO)**: 30 minutes  
**Recovery Point Objective (RPO)**: Last backup (max 24 hours)

**Steps**:
1. **IMMEDIATELY** stop all write operations to database
2. Assess scope of deletion (which tables/records affected)
3. If deletion was within last few hours:
   - Use Point-in-Time Recovery (Pro tier)
   - Restore to timestamp just before deletion
4. If PITR not available:
   - Restore from most recent automatic backup
   - Manually re-enter data lost between backup and deletion
5. Verify data integrity
6. Resume operations

### Scenario 2: Database Corruption

**RTO**: 1 hour  
**RPO**: Last backup (max 24 hours)

**Steps**:
1. Create emergency backup of current state (even if corrupted)
2. Identify source of corruption
3. Restore from last known good backup
4. Apply any migrations/changes that occurred since backup
5. Verify all tables and relationships
6. Run integrity checks
7. Resume operations

### Scenario 3: Complete Data Loss

**RTO**: 2-4 hours  
**RPO**: Last backup (max 24 hours)

**Steps**:
1. Create new Supabase project (if original is unrecoverable)
2. Restore from most recent backup
3. Update connection strings in application
4. Run database migrations to ensure schema is current
5. Verify all services can connect
6. Test critical flows (auth, payments, subscriptions)
7. Resume operations

### Scenario 4: Supabase Service Outage

**RTO**: Depends on Supabase SLA  
**RPO**: Real-time (no data loss)

**Steps**:
1. Monitor [Supabase Status Page](https://status.supabase.com/)
2. Enable maintenance mode on application
3. Wait for service restoration
4. Verify database connectivity
5. Test critical operations
6. Resume normal operations

---

## 🔍 Backup Verification

### Weekly Verification Checklist

Run this checklist every week:

- [ ] Verify automatic backups are running
- [ ] Check backup retention period is sufficient
- [ ] Confirm backup file sizes are reasonable (not 0 bytes)
- [ ] Test restore procedure on development environment
- [ ] Verify all critical tables are included in backups
- [ ] Check backup storage capacity

### Monthly Restore Test

**Perform a full restore test monthly**:

1. Create a new Supabase project (test environment)
2. Restore from production backup
3. Verify data integrity:
   ```sql
   -- Check row counts
   SELECT 'users' as table_name, COUNT(*) FROM users
   UNION ALL
   SELECT 'subscriptions', COUNT(*) FROM subscriptions
   UNION ALL
   SELECT 'referrals', COUNT(*) FROM referrals;
   
   -- Check for orphaned records
   SELECT * FROM subscriptions WHERE user_id NOT IN (SELECT id FROM users);
   
   -- Verify recent data
   SELECT MAX(created_at) FROM users;
   SELECT MAX(created_at) FROM subscriptions;
   ```
4. Test application connectivity
5. Document any issues
6. Delete test environment

---

## 📊 Backup Monitoring

### Metrics to Track

1. **Backup Success Rate**: Should be 100%
2. **Backup Size Trend**: Monitor for unexpected growth
3. **Backup Duration**: Should be consistent
4. **Storage Usage**: Ensure sufficient space

### Alerts to Configure

Set up alerts for:
- ❌ Backup failure
- ⚠️ Backup size anomaly (>50% change)
- ⚠️ Backup duration >30 minutes
- ❌ Storage capacity >80%

---

## 🔐 Backup Security

### Best Practices

1. **Encryption**: All backups are encrypted at rest (Supabase default)
2. **Access Control**: Limit who can access/restore backups
3. **Audit Trail**: Log all backup and restore operations
4. **Off-site Storage**: Consider exporting critical backups to separate cloud storage
5. **Retention Policy**: Keep backups for minimum 30 days

### Sensitive Data Handling

If exporting backups manually:
- ✅ Store in encrypted location
- ✅ Use strong passwords for compressed backups
- ✅ Never commit backups to Git
- ✅ Delete local backups after verification
- ❌ Never share backup files via email/Slack

---

## 📋 Pre-Migration Backup Checklist

Before any database migration:

- [ ] Create manual backup via Supabase Dashboard
- [ ] Export backup using pg_dump
- [ ] Verify backup file is not corrupted
- [ ] Document current row counts for all tables
- [ ] Test restore procedure on development environment
- [ ] Have rollback plan ready
- [ ] Notify team of maintenance window

---

## 🛠️ Backup Automation (Recommended)

### GitHub Actions Workflow

Create `.github/workflows/database-backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client
      
      - name: Create backup
        env:
          SUPABASE_CONNECTION_STRING: ${{ secrets.SUPABASE_CONNECTION_STRING }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          pg_dump "$SUPABASE_CONNECTION_STRING" \
            --no-owner --no-acl --clean --if-exists \
            | gzip > "backup_$TIMESTAMP.sql.gz"
      
      - name: Upload to cloud storage
        # Use AWS S3, Google Cloud Storage, or similar
        # Example for AWS S3:
        run: |
          aws s3 cp backup_*.sql.gz s3://your-backup-bucket/database/
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Notify on failure
        if: failure()
        # Send alert to Slack, email, or PagerDuty
        run: echo "Backup failed! Alert team."
```

---

## 📞 Emergency Contacts

**Database Issues**:
- Supabase Support: https://supabase.com/support
- Internal DBA: [Your DBA contact]
- DevOps Lead: [Your DevOps lead contact]

**Escalation Path**:
1. DevOps Engineer (0-15 minutes)
2. Backend Lead (15-30 minutes)
3. CTO (30+ minutes)

---

## 📚 Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)

---

**Last Updated**: 2025-01-07  
**Next Review**: 2025-02-07  
**Document Owner**: DevOps Team

