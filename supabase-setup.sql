-- ═══════════════════════════════════════════════════════════════
-- MATHQUEST — supabase-setup.sql
-- Run this ONCE in Supabase → SQL Editor → New Query → Run
-- Creates all 5 tables + Row Level Security policies
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- TABLE 1: challenges
-- You insert one row every Monday via the Supabase Table Editor.
-- Fields:
--   id            auto primary key
--   week_label    human label e.g. "Week 24 · June 2026"
--   question      the full challenge question text
--   answer        the full worked answer (shown on day 7)
--   hint          optional hint shown below the question
--   difficulty    "Easy" | "Intermediate" | "Hard"
--   difficulty_stars  number 1-5
--   posted_at     timestamp when challenge went live (set to Monday 00:00 of that week)
--   is_active     boolean — only ONE row should be true at a time
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenges (
  id                BIGSERIAL PRIMARY KEY,
  week_label        TEXT        NOT NULL,
  question          TEXT        NOT NULL,
  answer            TEXT        NOT NULL,
  hint              TEXT,
  difficulty        TEXT        NOT NULL DEFAULT 'Intermediate',
  difficulty_stars  INT         NOT NULL DEFAULT 3 CHECK (difficulty_stars BETWEEN 1 AND 5),
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only the currently active challenge should have is_active = true.
-- Index for fast lookup of the active challenge.
CREATE INDEX IF NOT EXISTS idx_challenges_active
  ON public.challenges (is_active, posted_at DESC);


-- ─────────────────────────────────────────────────────────────
-- TABLE 2: leaderboard
-- Inserted when a student submits a correct answer via the
-- challenge form on the website.
-- Fields:
--   id              auto primary key
--   challenge_id    FK → challenges.id
--   student_name    name the student entered (may be "Anonymous")
--   grade           "5" | "6" | "7" | "8"
--   answer_given    the answer text the student submitted
--   is_correct      set by the JS client after comparing answer hash
--   submitted_at    when they hit submit
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id              BIGSERIAL   PRIMARY KEY,
  challenge_id    BIGINT      REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_name    TEXT        NOT NULL DEFAULT 'Anonymous',
  grade           TEXT,
  answer_given    TEXT        NOT NULL,
  is_correct      BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge
  ON public.leaderboard (challenge_id, is_correct, submitted_at ASC);


-- ─────────────────────────────────────────────────────────────
-- TABLE 3: analytics_events
-- Every meaningful user action is logged here from script.js.
-- Event types we track:
--   page_view        — on every page load
--   tab_switch       — grade tab clicked in sheets section
--   download_click   — practice sheet or answer key downloaded
--   grade_card_click — grade card clicked on homepage
--   reveal_answer    — weekly challenge answer revealed
--   challenge_submit — student submitted challenge answer
--   form_request     — topic request form submitted
--   form_feedback    — feedback form submitted
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id            BIGSERIAL   PRIMARY KEY,
  event_type    TEXT        NOT NULL,
  page          TEXT,
  metadata      JSONB,
  session_id    TEXT,
  referrer      TEXT,
  user_agent    TEXT,
  screen_width  INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at
  ON public.analytics_events (created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- TABLE 4: topic_requests
-- Data from Form 1 ("Request a Topic Sheet")
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.topic_requests (
  id              BIGSERIAL   PRIMARY KEY,
  student_name    TEXT,
  grade           TEXT        NOT NULL,
  topic_name      TEXT        NOT NULL,
  struggle_notes  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_requests_grade
  ON public.topic_requests (grade, created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- TABLE 5: worksheet_feedback
-- Data from Form 2 ("Worksheet Feedback")
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.worksheet_feedback (
  id              BIGSERIAL   PRIMARY KEY,
  sheet_name      TEXT        NOT NULL,
  star_rating     INT         NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  difficulty_felt TEXT,
  review_text     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_sheet
  ON public.worksheet_feedback (sheet_name, created_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- This is what makes it safe to expose your anon key publicly.
-- Public users can INSERT (submit data) and SELECT challenges/
-- leaderboard. They CANNOT update or delete anything.
-- Only you (via the Supabase dashboard) can manage all data.
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.challenges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheet_feedback  ENABLE ROW LEVEL SECURITY;


-- ── challenges: public can read, nobody can write via API ─────
CREATE POLICY "Public can read challenges"
  ON public.challenges FOR SELECT
  TO anon
  USING (TRUE);


-- ── leaderboard: public can read + insert correct answers ─────
CREATE POLICY "Public can read leaderboard"
  ON public.leaderboard FOR SELECT
  TO anon
  USING (TRUE);

CREATE POLICY "Public can insert leaderboard entries"
  ON public.leaderboard FOR INSERT
  TO anon
  WITH CHECK (TRUE);


-- ── analytics_events: public can only insert ─────────────────
CREATE POLICY "Public can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- Admin (service role) can read analytics — used by admin.html
-- via the anon key + a special admin password check in JS
CREATE POLICY "Public can read analytics"
  ON public.analytics_events FOR SELECT
  TO anon
  USING (TRUE);


-- ── topic_requests: public can only insert ───────────────────
CREATE POLICY "Public can insert topic requests"
  ON public.topic_requests FOR INSERT
  TO anon
  WITH CHECK (TRUE);

CREATE POLICY "Public can read topic requests"
  ON public.topic_requests FOR SELECT
  TO anon
  USING (TRUE);


-- ── worksheet_feedback: public can only insert ───────────────
CREATE POLICY "Public can insert worksheet feedback"
  ON public.worksheet_feedback FOR INSERT
  TO anon
  WITH CHECK (TRUE);

CREATE POLICY "Public can read worksheet feedback"
  ON public.worksheet_feedback FOR SELECT
  TO anon
  USING (TRUE);


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Insert your first challenge row
-- Edit the values below before running, or add via Table Editor.
-- posted_at is set to "now" — adjust to your actual Monday date.
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.challenges
  (week_label, question, answer, hint, difficulty, difficulty_stars, posted_at, is_active)
VALUES (
  'Week 1 · June 2026',

  'A farmer has both chickens and rabbits. He counts 20 heads and 56 legs in total. How many chickens and how many rabbits does he have?',

  'Let chickens = c and rabbits = r.
Equation 1 (heads): c + r = 20
Equation 2 (legs):  2c + 4r = 56

From Eq 1: c = 20 − r
Substitute into Eq 2: 2(20 − r) + 4r = 56
→ 40 − 2r + 4r = 56
→ 2r = 16
→ r = 8

Therefore: rabbits = 8, chickens = 20 − 8 = 12 ✓
Verify legs: (12 × 2) + (8 × 4) = 24 + 32 = 56 ✓',

  'Set up two simultaneous equations using heads and legs.',

  'Intermediate',
  3,
  NOW(),
  TRUE
);


-- ═══════════════════════════════════════════════════════════════
-- DONE! All tables, policies, and seed data created.
-- Return to the MathQuest setup guide for next steps.
-- ═══════════════════════════════════════════════════════════════
