
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('parent', 'trainer', 'admin');

-- Create session status enum
CREATE TYPE public.session_status AS ENUM ('pending', 'approved', 'completed', 'rejected');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 4 AND age <= 18),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own children" ON public.children FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can add children" ON public.children FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents can update own children" ON public.children FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Parents can delete own children" ON public.children FOR DELETE USING (auth.uid() = parent_id);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(10,2),
  image_url TEXT,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert courses" ON public.courses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update courses" ON public.courses FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = parent_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can create enrollments" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Admins can update enrollments" ON public.enrollments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Trainer availability table
CREATE TABLE public.trainer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trainer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view availability" ON public.trainer_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trainers manage own availability" ON public.trainer_availability FOR INSERT WITH CHECK (auth.uid() = trainer_id AND public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers update own availability" ON public.trainer_availability FOR UPDATE USING (auth.uid() = trainer_id AND public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers delete own availability" ON public.trainer_availability FOR DELETE USING (auth.uid() = trainer_id AND public.has_role(auth.uid(), 'trainer'));

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  availability_id UUID REFERENCES public.trainer_availability(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status session_status NOT NULL DEFAULT 'pending',
  meet_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents create sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Trainers update assigned sessions" ON public.sessions FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'parent'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed courses
INSERT INTO public.courses (title, description, duration, price, discount_price, features) VALUES
(
  '3-Day AI Crash Course',
  'An intensive weekend bootcamp where kids explore the world of AI through hands-on projects. Perfect for beginners who want a taste of AI.',
  '3 Days',
  10000,
  2500,
  ARRAY['Introduction to AI & ChatGPT', 'Create AI Art & Images', 'Build a Mini AI Project', 'Certificate of Completion', 'Live Q&A with Trainer']
),
(
  '1-Month AI Program',
  'A comprehensive deep-dive program covering advanced AI concepts, coding fundamentals, and portfolio-worthy projects with 1-on-1 mentorship.',
  '4 Weeks',
  25000,
  8500,
  ARRAY['Everything in Crash Course', 'Advanced AI Tools & Coding', 'Build 5+ Real Projects', '1-on-1 Mentorship Sessions', 'Portfolio & Certificate', 'Parent Progress Reports']
);
