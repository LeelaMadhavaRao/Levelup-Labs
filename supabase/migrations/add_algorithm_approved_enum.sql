-- Add 'algorithm_approved' to solution_status enum if it doesn't exist
DO $$ BEGIN
  -- Check if the enum value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'algorithm_approved' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'solution_status')
  ) THEN
    -- Add the new enum value after 'algorithm_verified'
    ALTER TYPE solution_status ADD VALUE 'algorithm_approved' AFTER 'algorithm_verified';
  END IF;
END $$;
