# Timetable & Syllabus Calendar — Technical Design Document

> **Project:** Merit Home School Management System  
> **Stack:** Next.js (App Router) + Express.js + MySQL (mysql2/promise)  
> **Database:** MySQL (NOT MongoDB/Mongoose — the project uses `mysql2/promise` via a connection pool)

---

## 🏗️ 1. System Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  Admin    │    │   Teacher     │    │   Student     │          │
│  │(Edit Mode)│    │ (Read-Only)  │    │ (Read-Only)  │          │
│  └────┬─────┘    └──────┬───────┘    └──────┬───────┘           │
│       │ timetableApi.*  │ timetableApi.view  │ timetableApi.view│
└───────┼─────────────────┼────────────────────┼──────────────────┘
        │                 │                    │
        ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express Backend                             │
│  timetableRoute.js → timetableController.js → MySQL Pool (db)  │
│  ┌─────────────────┐  ┌─────────────────────────┐              │
│  │ auth.js          │  │ protect + authorize      │              │
│  │ (Admin CRUD)     │  │ (Teacher/Student Read)   │              │
│  └─────────────────┘  └─────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Component Structure (Follows Existing Patterns)

| Layer | File | Pattern Matched From |
|-------|------|----------------------|
| **Backend Route** | `backend/src/routes/timetable.js` | homework.js route |
| **Backend Controller** | `backend/src/controllers/timetableController.js` | homeworkController.js |
| **Frontend API** | `lib/api.ts` → `timetableApi` export | Existing `chatGroupsApi`, `homeworkApi` pattern |
| **Admin Component** | `components/dashboard/timetable-content.tsx` | admin-homework.tsx |
| **Teacher Page** | `app/(protected)/teacherdashboard/timetable/page.tsx` | teacherdashboard/chat/page.tsx |
| **Student Page** | `app/(protected)/student/timetable/page.tsx` | student/chat/page.tsx |
| **Shared Calendar Grid** | `components/timetable/TimetableCalendar.tsx` | Like `components/chat/ChatLayout.tsx` shared component |

---

## 🗄️ 2. Database Schema Design

> **IMPORTANT:** This project uses **MySQL**, not MongoDB/Mongoose. All schemas are SQL tables, using `db.query()` via the existing `mysql2/promise` pool in `backend/src/config/db.js`.

### Table 1: `timetable_configs`

Stores the **per-batch, per-month header configuration** — which subject is assigned to which day-of-week, including the color code. This is the "header row" from the reference image (Mon=Bio, Tue=Phy, etc.).

```sql
CREATE TABLE IF NOT EXISTS timetable_configs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT UNSIGNED NOT NULL,
  batch         VARCHAR(100) NOT NULL,           -- e.g., "Class 9 Batch A"
  month         TINYINT NOT NULL,                -- 1–12
  year          SMALLINT NOT NULL,               -- 2026
  day_of_week   TINYINT NOT NULL,                -- 0=Sun, 1=Mon ... 6=Sat
  subject       VARCHAR(100) NOT NULL DEFAULT '',-- e.g., "Bio", "Phy", "W. Off"
  color_code    VARCHAR(7) NOT NULL DEFAULT '#FFFFFF', -- hex e.g., "#FFF9C4"
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uq_config (admin_id, batch, year, month, day_of_week)
);
```

**Why separate?** The "Copy Month" feature copies this config first, then entries. Keeping it separate means:
- Config is only 7 rows per batch-month (one per weekday)
- Fast `INSERT ... SELECT` bulk copy

### Table 2: `timetable_entries`

Stores the **individual cell data** — one row per day that has content.

```sql
CREATE TABLE IF NOT EXISTS timetable_entries (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT UNSIGNED NOT NULL,
  batch         VARCHAR(100) NOT NULL,
  entry_date    DATE NOT NULL,                   -- the actual calendar date
  subject       VARCHAR(100) DEFAULT '',         -- subject override (or from config)
  topic         VARCHAR(255) DEFAULT '',         -- "Tissues", "Gravitation"
  entry_type    ENUM('class','test','holiday','off') DEFAULT 'class',
  test_subject  VARCHAR(100) DEFAULT '',         -- "Weekly Test (Bio)" subject
  note          TEXT DEFAULT NULL,               -- extra notes (marking scheme etc.)
  color_override VARCHAR(7) DEFAULT NULL,        -- override the day-of-week color
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uq_entry (admin_id, batch, entry_date),
  INDEX idx_batch_month (batch, entry_date)
);
```

**Design Rationale:**
- `UNIQUE KEY (admin_id, batch, entry_date)` prevents duplicate entries
- `entry_type` ENUM cleanly distinguishes Regular Class / Weekly Test / Holiday / Weekly Off
- `color_override` lets holidays (e.g., "Independence Day") or tests get a distinct color
- `INDEX idx_batch_month` ensures fast `WHERE batch = ? AND entry_date BETWEEN ? AND ?` queries

### Why This Schema Makes "Copy Month" Fast

```
Step 1: Copy timetable_configs (7 rows) → just change month/year
Step 2: Copy timetable_entries → map by day_of_week, shift to new month dates
```

No embedded arrays, no JSON blobs — pure relational SQL that can be bulk-copied with `INSERT ... SELECT`.

---

## ⚙️ 3. API Endpoints & "Copy Month" Algorithm

### REST API Endpoints

All routes mounted at `/api/timetable` in `backend/src/app.js`.

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/api/timetable/:batch/:year/:month` | `auth` (admin) | Admin | Get full month data (config + entries) |
| `GET` | `/api/timetable/view/:batch/:year/:month` | `protect` | All | Read-only view for teacher/student |
| `POST` | `/api/timetable/config` | `auth` | Admin | Save/update day-of-week → subject mapping |
| `POST` | `/api/timetable/entry` | `auth` | Admin | Create/update a single day entry |
| `PUT` | `/api/timetable/entry/:id` | `auth` | Admin | Update an existing entry |
| `DELETE` | `/api/timetable/entry/:id` | `auth` | Admin | Delete an entry |
| `POST` | `/api/timetable/copy-month` | `auth` | Admin | **Copy previous month → target month** |
| `GET` | `/api/timetable/batches` | `auth` | Admin | List available batches for dropdown |

### Middleware Strategy

```
Admin routes    → auth.js (existing, sets req.admin)
View routes     → protect + authorize(['ADMIN','TEACHER','STUDENT']) from authMiddleware.js
```

This matches the dual-middleware pattern already used in the homework routes.

### The "Copy Month" Algorithm — Step by Step

**Endpoint:** `POST /api/timetable/copy-month`  
**Body:** `{ batch, sourceMonth, sourceYear, targetMonth, targetYear }`

```
┌──────────────────────────────────────────────────────────────┐
│                   COPY MONTH ALGORITHM                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 1 — VALIDATE                                           │
│    • Confirm source month has data                           │
│    • Confirm target month is empty (or prompt overwrite)     │
│                                                              │
│  STEP 2 — COPY CONFIG (day-of-week → subject mapping)        │
│    INSERT INTO timetable_configs                             │
│      (admin_id, batch, month, year, day_of_week,             │
│       subject, color_code)                                   │
│    SELECT admin_id, batch, targetMonth, targetYear,          │
│      day_of_week, subject, color_code                        │
│    FROM timetable_configs                                    │
│    WHERE batch=? AND month=sourceMonth AND year=sourceYear   │
│    ON DUPLICATE KEY UPDATE                                   │
│      subject = VALUES(subject),                              │
│      color_code = VALUES(color_code)                         │
│                                                              │
│  STEP 3 — BUILD DAY-OF-WEEK MAP FROM SOURCE                 │
│    For each source entry:                                    │
│      dayOfWeek = new Date(entry_date).getDay()  // 0-6       │
│      weekIndex = which occurrence (1st Mon, 2nd Mon, etc.)   │
│      Store: map[dayOfWeek][weekIndex] = entry                │
│                                                              │
│  STEP 4 — MAP ONTO TARGET MONTH DATES                        │
│    Generate all dates in target month                        │
│    For each target date:                                     │
│      dayOfWeek = targetDate.getDay()                         │
│      weekIndex = which occurrence of that weekday            │
│      Look up: sourceEntry = map[dayOfWeek][weekIndex]        │
│      If found → INSERT with targetDate, same topic/type      │
│      If NOT found (overflow) → leave empty                   │
│                                                              │
│  STEP 5 — SKIP HOLIDAYS                                      │
│    Holidays are NOT copied (they are date-specific).         │
│    Only entry_type='class' and 'test' are copied.            │
│    'off' (weekly off) is auto-populated from config.         │
│                                                              │
│  STEP 6 — RETURN preview data to frontend                    │
│    Return the generated entries for confirmation before       │
│    committing (2-step: preview → confirm)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Edge Case: Month Length Mismatch

| Scenario | Solution |
|----------|----------|
| Aug has 5 Mondays, Sept has 4 | 5th Monday's data is **dropped** — no entry is created. Summary: "1 Monday entry was skipped." |
| Sept has 5 Tuesdays, Aug had 4 | 5th Tuesday is left **blank** — admin can manually fill it. |
| Feb (28/29 days) from Jan (31) | Only copies what fits. Overflow entries listed in "skipped" summary. |

---

## 🎨 4. Frontend UI/UX Strategy

### 4.1 Admin View — Edit Mode

**Component:** `components/dashboard/timetable-content.tsx`  
**Sidebar entry:** Add `"timetable"` to `SectionType` in sidebar.tsx

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  📅 Timetable Management                                     │
│  [Batch Dropdown ▼]  [◀ Jul]  Aug-26  [Sep ▶]               │
│  [+ Copy from July]  [Export PDF]                            │
├──────────────────────────────────────────────────────────────┤
│  HEADER ROW (editable by admin):                             │
│  Sun     │ Mon(Bio) │ Tue(Phy) │ Wed(Hindi)│ Thu(Chem)│...   │
│  #FFE0E0 │ #E8F5E9  │ #FFF9C4  │ #E3F2FD  │ #FCE4EC │...   │
├──────────────────────────────────────────────────────────────┤
│  Calendar grid — 5-6 rows × 7 columns                       │
│  Each cell is CLICKABLE → opens edit modal                   │
│  ┌─────────┐                                                 │
│  │ 3        │ ← date number                                  │
│  │ TISSUES  │ ← topic (bold)                                 │
│  │ 📝 Test  │ ← badge if test/holiday                        │
│  └─────────┘                                                 │
└──────────────────────────────────────────────────────────────┘
```

#### Edit Modal (clicking a cell)
- **Subject** — auto-filled from day-of-week config, can be overridden
- **Topic** — text input (e.g., "Tissues", "Gravitation")
- **Type** dropdown — `Class | Weekly Test | Holiday | Off`
- **Test Subject** — visible only when type = "Weekly Test"
- **Note** — textarea for marking scheme, instructions
- **Save / Delete** buttons

#### "Copy from Previous Month" Flow
1. Admin clicks **"📋 Copy from July"** button
2. Backend generates a **preview** — returns the mapped entries
3. Frontend shows a **side-by-side preview modal**
4. Admin reviews, can toggle off individual entries
5. Clicks **"Confirm Copy"** → backend commits the entries
6. Success toast: "27 entries copied, 2 skipped (overflow)"

### 4.2 Teacher & Student View — Read-Only Mode

Shared: `components/timetable/TimetableCalendar.tsx`

#### Color-Coding Strategy

| Day Type | Color | Cell Style |
|----------|-------|------------|
| **Mon (Bio)** | `#E8F5E9` (soft green) | Background tint, green left-border |
| **Tue (Phy)** | `#FFF9C4` (soft yellow) | Background tint, yellow left-border |
| **Wed (Hindi)** | `#E3F2FD` (soft blue) | Background tint, blue left-border |
| **Thu (Chem)** | `#FCE4EC` (soft pink) | Background tint, pink left-border |
| **Fri (Math)** | `#F3E5F5` (soft purple) | Background tint, purple left-border |
| **Sat (W. Off)** | `#ECEFF1` (light grey) | Muted, italic "W. Off" |
| **Sunday (Test)** | `#FFF3E0` (soft orange) | Orange badge "Weekly Test (Subject)" |
| **Holiday** | `#FFCDD2` (light red) | Red banner, flag emoji |

Colors are configurable by the admin in the header config step.

### 4.3 State Management

```typescript
export const timetableApi = {
  getMonth:    (batch, year, month) => get(`/timetable/${encodeURIComponent(batch)}/${year}/${month}`),
  saveConfig:  (data) => post("/timetable/config", data),
  saveEntry:   (data) => post("/timetable/entry", data),
  updateEntry: (id, data) => put(`/timetable/entry/${id}`, data),
  deleteEntry: (id) => del(`/timetable/entry/${id}`),
  copyMonth:   (data) => post("/timetable/copy-month", data),
  getBatches:  () => get("/timetable/batches"),
  viewMonth:   (batch, year, month) => get(`/timetable/view/${encodeURIComponent(batch)}/${year}/${month}`),
};
```

**Strategy:** Load full month data on mount & on month/batch change. No caching — data is small (~35 entries). Use `useState` locally.

---

## 🛡️ 5. Security & Edge Case Matrix

| # | Issue | Solution |
|---|-------|----------|
| 1 | Student/Teacher calls Admin APIs | Admin routes use `auth.js` (admin JWT only). View route uses `protect + authorize`. |
| 2 | 5 Mondays vs 4 Mondays (overflow) | Copy maps by `(dayOfWeek, weekIndex)`. Missing dates skipped with summary. |
| 3 | Holiday falls on weekend | Holidays stored by exact date. Rendered with holiday styling regardless of column. |
| 4 | Admin edits day with existing test | Modal pre-fills existing data. Confirmation prompt on type change. |
| 5 | Copy month when target has data | API returns `{ conflict: true }`. Frontend: "Overwrite N entries?" |
| 6 | Batch doesn't exist / no data | Returns empty arrays. Frontend shows "No timetable" with setup CTA. |
| 7 | Multiple admins editing | `ON DUPLICATE KEY UPDATE` — last-write-wins. |
| 8 | Student sees another batch | View API scopes by `req.user.course` for students. |
| 9 | SQL injection | All queries use parameterized `?` placeholders. |
| 10 | February leap year | `new Date(year, month, 0).getDate()` handles correctly. |

---

## 🗺️ 6. Step-by-Step Implementation Roadmap

### Phase 1: Database & Backend
| Step | File | Action |
|------|------|--------|
| 1.1 | `backend/src/controllers/timetableController.js` | **[NEW]** Controller with 7 handlers |
| 1.2 | `backend/src/routes/timetable.js` | **[NEW]** Route file |
| 1.3 | `backend/src/app.js` | **[MODIFY]** Mount route |
| 1.4 | Database | Run `CREATE TABLE` statements |

### Phase 2: Frontend API Layer
| Step | File | Action |
|------|------|--------|
| 2.1 | `lib/api.ts` | **[MODIFY]** Add `timetableApi` export |

### Phase 3: Admin Frontend
| Step | File | Action |
|------|------|--------|
| 3.1 | `components/timetable/TimetableCalendar.tsx` | **[NEW]** Shared calendar grid |
| 3.2 | `components/timetable/TimetableEntryModal.tsx` | **[NEW]** Edit modal |
| 3.3 | `components/timetable/TimetableCopyPreview.tsx` | **[NEW]** Copy preview dialog |
| 3.4 | `components/dashboard/timetable-content.tsx` | **[NEW]** Admin wrapper |
| 3.5 | `components/dashboard/sidebar.tsx` | **[MODIFY]** Add "Timetable" to SectionType + menu |
| 3.6 | `app/(protected)/dashboard/page.tsx` | **[MODIFY]** Add timetable case |

### Phase 4: Teacher & Student Frontend
| Step | File | Action |
|------|------|--------|
| 4.1 | `app/(protected)/teacherdashboard/timetable/page.tsx` | **[NEW]** Teacher page |
| 4.2 | `app/(protected)/student/timetable/page.tsx` | **[NEW]** Student page |
| 4.3 | `components/teacher/DashboardSidebar.tsx` | **[MODIFY]** Add "Timetable" link |
| 4.4 | `components/student/StudentSidebar.tsx` | **[MODIFY]** Add "Timetable" link |

### Phase 5: Polish & Verification
| Step | Action |
|------|--------|
| 5.1 | Test all CRUD operations |
| 5.2 | Test "Copy Month" edge cases |
| 5.3 | Verify RBAC (teacher/student read-only) |
| 5.4 | Verify color-coding matches reference |
| 5.5 | Test mobile responsiveness |

---

## New Files (8)
1. `backend/src/controllers/timetableController.js`
2. `backend/src/routes/timetable.js`
3. `components/timetable/TimetableCalendar.tsx`
4. `components/timetable/TimetableEntryModal.tsx`
5. `components/timetable/TimetableCopyPreview.tsx`
6. `components/dashboard/timetable-content.tsx`
7. `app/(protected)/teacherdashboard/timetable/page.tsx`
8. `app/(protected)/student/timetable/page.tsx`

## Modified Files (6)
1. `backend/src/app.js` — Mount timetable route
2. `lib/api.ts` — Add `timetableApi`
3. `components/dashboard/sidebar.tsx` — Add "Timetable" menu + SectionType
4. `app/(protected)/dashboard/page.tsx` — Add timetable case
5. `components/teacher/DashboardSidebar.tsx` — Add "Timetable" nav link
6. `components/student/StudentSidebar.tsx` — Add "Timetable" nav link
