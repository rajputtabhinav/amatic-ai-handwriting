#!/bin/bash

# Amatic.ai Database Backup Script
# This script creates a compressed backup of the Supabase database

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
fi

# Configuration
BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/amatic_backup_$TIMESTAMP.sql.gz"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if connection string is set
if [ -z "$SUPABASE_CONNECTION_STRING" ]; then
    echo -e "${RED}❌ Error: SUPABASE_CONNECTION_STRING not set${NC}"
    echo "Please set it in .env.local or export it:"
    echo "export SUPABASE_CONNECTION_STRING='postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres'"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}🔄 Starting database backup...${NC}"
pg_dump "$SUPABASE_CONNECTION_STRING" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}📁 Location: $BACKUP_FILE${NC}"
    
    # Calculate file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}📦 Backup size: $SIZE${NC}"
    
    # Count number of backups
    BACKUP_COUNT=$(ls -1 $BACKUP_DIR/*.sql.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}📊 Total backups: $BACKUP_COUNT${NC}"
    
    # Delete backups older than 30 days
    DELETED=$(find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete -print | wc -l)
    if [ $DELETED -gt 0 ]; then
        echo -e "${YELLOW}🗑️  Cleaned up $DELETED old backup(s) (>30 days)${NC}"
    fi
    
    echo -e "${GREEN}✨ Backup process complete!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

