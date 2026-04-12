
ALTER TABLE public.trainer_availability
ADD COLUMN max_capacity integer NOT NULL DEFAULT 100,
ADD COLUMN booked_count integer NOT NULL DEFAULT 0;
