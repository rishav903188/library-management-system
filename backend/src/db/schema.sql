CREATE TYPE user_role AS ENUM ('student', 'librarian', 'admin');

CREATE TYPE borrow_status AS ENUM ('borrowed', 'returned');

CREATE TYPE fine_status AS ENUM ('unpaid', 'paid', 'waived');

CREATE TYPE reservation_status AS ENUM ('waiting', 'notified', 'fulfilled', 'cancelled');

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      TEXT NOT NULL,


  role          user_role NOT NULL DEFAULT 'student',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

-- USERS


CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  

  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      TEXT NOT NULL,
  

  role          user_role NOT NULL DEFAULT 'student',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  
);

-- BOOKS


CREATE TABLE IF NOT EXISTS books (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255) NOT NULL,
  author            VARCHAR(150) NOT NULL,
  isbn              VARCHAR(20) NOT NULL UNIQUE,
  genre             VARCHAR(100) NOT NULL DEFAULT 'General',
  total_copies      INTEGER NOT NULL DEFAULT 1,
  available_copies  INTEGER NOT NULL DEFAULT 1,
  cover_image       TEXT,

  
  CONSTRAINT copies_valid CHECK (available_copies >= 0),
  CONSTRAINT copies_range CHECK (available_copies <= total_copies),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- BORROWS


CREATE TABLE IF NOT EXISTS borrows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,


  borrow_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date      TIMESTAMPTZ NOT NULL,
  return_date   TIMESTAMPTZ,
  

  status        borrow_status NOT NULL DEFAULT 'borrowed',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FINES


CREATE TABLE IF NOT EXISTS fines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  borrow_id     UUID NOT NULL REFERENCES borrows(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,

  days_late     INTEGER NOT NULL CHECK (days_late > 0),

  amount        NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),


  status        fine_status NOT NULL DEFAULT 'unpaid',
  paid_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- RESERVATIONS


CREATE TABLE IF NOT EXISTS reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,

  status        reservation_status NOT NULL DEFAULT 'waiting',
  notified_at   TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- INDEXES


CREATE INDEX IF NOT EXISTS idx_borrows_user_id ON borrows(user_id);
CREATE INDEX IF NOT EXISTS idx_borrows_book_id ON borrows(book_id);
CREATE INDEX IF NOT EXISTS idx_borrows_status ON borrows(status);


CREATE INDEX IF NOT EXISTS idx_fines_user_id ON fines(user_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);

CREATE INDEX IF NOT EXISTS idx_reservations_book_status ON reservations(book_id, status);


CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);