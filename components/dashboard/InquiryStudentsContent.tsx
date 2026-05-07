"use client"

import { useState, useEffect, useCallback } from "react"
import { inquiryExtraApi } from "@/lib/api"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Inquiry {
  id: number
  studentName: string
  dob: string
  studentContact: string
  parentContact: string
  batch: string
  standard: string
  lastExamMarks: string
  collegeName: string
  collegeTiming: string
  fatherOccupation: string
  motherOccupation: string
  address: string
  branch: string          // NEW
  email: string
  futurePlans: string
  reference: string
  siblingName: string
  sex: string
  takingCoaching: string
  hostelRequired: string
  status: string          // NEW  "Confirmed" | "Pending" | "Maybe"
  feedback1: string       // NEW
  feedback2: string       // NEW
  notes: string           // NEW
  created_at: string
}

interface InquiryExtraRow {
  id: number
  name: string
  phone: string
  father_name: string
  father_phone: string
  course: string
  location: string
  board: string
  standard: string
  status: string          // NEW
  video: string
  dob: string
  email: string
  address: string
  branch: string          // NEW
  college_name: string
  college_timing: string
  last_exam_marks: string
  father_occupation: string
  mother_occupation: string
  future_plans: string
  reference: string
  sibling_name: string
  sex: string
  taking_coaching: string
  hostel_required: string
  feedback1: string       // NEW
  feedback2: string       // NEW
  notes: string           // NEW
  admin_id: number
  inquiry_date: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", phone: "", father_name: "", father_phone: "", dob: "", sex: "",
  email: "", address: "", branch: "",
  standard: "", course: "", last_exam_marks: "", college_name: "", college_timing: "",
  future_plans: "", father_occupation: "", mother_occupation: "", sibling_name: "",
  reference: "", taking_coaching: "", hostel_required: "",
  status: "Pending", feedback1: "", feedback2: "", notes: "",
}

const REF_BADGE: Record<string, string> = {
  "Social Media (Instagram/Facebook)": "bg-pink-100 text-pink-700 border-pink-200",
  "Google":    "bg-blue-100 text-blue-700 border-blue-200",
  "Hoarding":  "bg-purple-100 text-purple-700 border-purple-200",
  "Website":   "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Justdial":  "bg-orange-100 text-orange-700 border-orange-200",
  "Friends":   "bg-green-100 text-green-700 border-green-200",
  "Pamphlets": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Other":     "bg-gray-100 text-gray-600 border-gray-200",
}

const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-green-50 border-green-200 text-green-700",
  Pending:   "bg-yellow-50 border-yellow-300 text-yellow-700",
  Maybe:     "bg-blue-50 border-blue-200 text-blue-600",
}

const STATUS_DOT: Record<string, string> = {
  Confirmed: "bg-green-500",
  Pending:   "bg-yellow-400",
  Maybe:     "bg-blue-400",
}

/* Drawer CSS animations injected once into the page */
const DRAWER_STYLES = `
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); }
    to   { transform: translateX(100%); }
  }
  @keyframes fadeInBg {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .drawer-in  { animation: slideInRight  0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
  .drawer-out { animation: slideOutRight 0.26s cubic-bezier(0.55,0,1,0.45) forwards; }
  .fade-in-bg { animation: fadeInBg 0.25s ease forwards; }
`

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function InquiryStudentsContent() {
  const [inquiries, setInquiries]     = useState<Inquiry[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [search, setSearch]           = useState("")
  const [selected, setSelected]       = useState<Inquiry | null>(null)
  const [filterSex, setFilterSex]     = useState("")
  const [filterBatch, setFilterBatch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")  // NEW

  // ── Drawer state ──
  const [drawerMounted, setDrawerMounted] = useState(false)
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [formData, setFormData]           = useState(EMPTY_FORM)
  const [formLoading, setFormLoading]     = useState(false)
  const [formError, setFormError]         = useState("")
  const [formSuccess, setFormSuccess]     = useState("")

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data: any = await inquiryExtraApi.getAll()
      if (data.success) {
        const mapped: Inquiry[] = (data.data || []).map((row: InquiryExtraRow) => ({
          id: row.id,
          studentName:     row.name || "",
          dob:             row.dob || "",
          studentContact:  row.phone || "",
          parentContact:   row.father_phone || "",
          batch:           row.course || "",
          standard:        row.standard || "",
          lastExamMarks:   row.last_exam_marks || "",
          collegeName:     row.college_name || "",
          collegeTiming:   row.college_timing || "",
          fatherOccupation:row.father_occupation || "",
          motherOccupation:row.mother_occupation || "",
          address:         row.address || "",
          branch:          row.branch || "",        // NEW
          email:           row.email || "",
          futurePlans:     row.future_plans || "",
          reference:       row.reference || "",
          siblingName:     row.sibling_name || "",
          sex:             row.sex || "",
          takingCoaching:  row.taking_coaching || "",
          hostelRequired:  row.hostel_required || "",
          status:          row.status || "Pending", // NEW
          feedback1:       row.feedback1 || "",     // NEW
          feedback2:       row.feedback2 || "",     // NEW
          notes:           row.notes || "",         // NEW
          created_at:      row.inquiry_date || "",
        }))
        setInquiries(mapped)
      } else {
        setError(data.message || "Failed to load inquiries")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInquiries() }, [fetchInquiries])

  const openDrawer = () => {
    setDrawerMounted(true)
    requestAnimationFrame(() => setDrawerOpen(true))
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => {
      setDrawerMounted(false)
      setFormData(EMPTY_FORM)
      setFormError("")
      setFormSuccess("")
    }, 280)
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleAddSubmit = async () => {
    setFormError("")
    setFormSuccess("")
    if (!formData.name.trim())     return setFormError("Student name is required.")
    if (!formData.phone.trim())    return setFormError("Student contact is required.")
    if (!formData.standard.trim()) return setFormError("Standard is required.")

    setFormLoading(true)
    try {
      const payload = { ...formData, inquiry_date: new Date().toISOString() }
      const data: any = await inquiryExtraApi.create(payload)
      if (data.success) {
        setFormSuccess("Inquiry added successfully!")
        setFormData(EMPTY_FORM)
        await fetchInquiries()
        setTimeout(() => closeDrawer(), 1200)
      } else {
        setFormError(data.message || "Failed to add inquiry.")
      }
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setFormLoading(false)
    }
  }

  // ── Quick status update inline ──
  const handleStatusChange = async (id: number, newStatus: string) => {
    // Optimistic update
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))
    try {
      await inquiryExtraApi.update(id, { status: newStatus })
    } catch {
      fetchInquiries() // revert on failure
    }
  }

  const filtered = inquiries.filter(i => {
    const q = search.toLowerCase()
    const matchSearch =
      i.studentName?.toLowerCase().includes(q) ||
      i.studentContact?.includes(q) ||
      i.email?.toLowerCase().includes(q) ||
      i.standard?.toLowerCase().includes(q) ||
      i.branch?.toLowerCase().includes(q)
    const matchSex    = filterSex    ? i.sex === filterSex       : true
    const matchBatch  = filterBatch  ? i.batch === filterBatch   : true
    const matchStatus = filterStatus ? i.status === filterStatus : true
    return matchSearch && matchSex && matchBatch && matchStatus
  })

  const handleExportExcel = () => {
    if (!filtered.length) { alert("No inquiries to export"); return }
    const headers = [
      "ID","Student Name","Gender","Student Contact","Parent Contact","Email",
      "Standard","Batch","Branch","Address","Reference","Status",
      "Feedback 1","Feedback 2","Notes","Hostel Required","Taking Coaching","Date",
    ]
    const rows = filtered.map(inq => [
      inq.id, inq.studentName, inq.sex, inq.studentContact, inq.parentContact,
      inq.email, inq.standard, inq.batch, inq.branch, inq.address,
      inq.reference, inq.status, inq.feedback1, inq.feedback2, inq.notes,
      inq.hostelRequired, inq.takingCoaching,
      inq.created_at ? new Date(inq.created_at).toLocaleDateString("en-CA") : "",
    ])
    const esc = (v: string | number) => `"${String(v).replace(/"/g, "\"\"")}"`
    const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `inquiry_students_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const statCards = [
    {
      label: "Total Inquiries", value: inquiries.length,
      bg: "bg-[#2563EB]",
      icon: <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: "Confirmed", value: inquiries.filter(i => i.status === "Confirmed").length,
      bg: "bg-[#16A34A]",
      icon: <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Pending", value: inquiries.filter(i => i.status === "Pending").length,
      bg: "bg-[#EA580C]",
      icon: <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Maybe", value: inquiries.filter(i => i.status === "Maybe").length,
      bg: "bg-[#7C3AED]",
      icon: <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ]

  return (
    <>
      <style>{DRAWER_STYLES}</style>

      <div className="space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inquiry Students</h1>
            <p className="text-gray-500 text-sm mt-0.5">All student inquiries submitted via the public form</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button onClick={openDrawer}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Inquiry
            </button>
            <button onClick={fetchInquiries}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className={`${card.bg} rounded-2xl px-5 py-5 flex flex-col gap-3`}>
              <div className="flex items-center justify-between">
                <p className="text-white/80 text-sm font-medium leading-tight">{card.label}</p>
                {card.icon}
              </div>
              <p className="text-white text-3xl font-bold leading-none">{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by name, phone, email, branch..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all" />
          </div>
          <select value={filterSex} onChange={e => setFilterSex(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all cursor-pointer">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all cursor-pointer">
            <option value="">All Batches</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          {/* NEW: Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all cursor-pointer">
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Maybe">Maybe</option>
          </select>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 animate-spin text-[#2563EB]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-400 text-sm">Loading inquiries...</p>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && (
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Sr no.</th>
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Student</th>
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Contact</th>
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Standard</th>
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Batch</th>
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Branch & Address</th>{/* NEW */}
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Reference</th>
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Status</th>{/* NEW */}
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Feedback 1</th>{/* NEW */}
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Feedback 2</th>{/* NEW */}
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Notes</th>{/* NEW */}
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Inquiry Date</th>{/* renamed */}
                    <th className="text-left px-4 py-3 text-white font-semibold text-xs whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-16 text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        No inquiries found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inq, idx) => (
                      <tr key={inq.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs font-medium">{idx + 1}</td>

                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                              <span className="text-white font-bold text-xs">
                                {inq.studentName?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-900 font-semibold text-sm leading-tight whitespace-nowrap">{inq.studentName || "—"}</p>
                              <p className="text-gray-400 text-xs">{inq.sex || "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3">
                          <p className="text-gray-700 text-xs font-medium whitespace-nowrap">{inq.studentContact || "—"}</p>
                          <p className="text-gray-400 text-xs">{inq.email || "—"}</p>
                        </td>

                        {/* Standard */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold whitespace-nowrap">
                            {inq.standard || "—"}
                          </span>
                        </td>

                        {/* Batch */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${
                            inq.batch === "Online"
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-gray-50 border-gray-200 text-gray-600"
                          }`}>
                            {inq.batch || "—"}
                          </span>
                        </td>

                        {/* Branch & Address — NEW */}
                        <td className="px-4 py-3 max-w-[160px]">
                          {inq.branch && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold block w-fit mb-1">
                              {inq.branch}
                            </span>
                          )}
                          <p className="text-gray-500 text-xs leading-snug truncate" title={inq.address}>
                            {inq.address || "—"}
                          </p>
                        </td>

                        {/* Reference */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${REF_BADGE[inq.reference] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                            {inq.reference || "—"}
                          </span>
                        </td>

                        {/* Status — NEW (inline dropdown) */}
                        <td className="px-4 py-3">
                          <div className="relative inline-flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[inq.status] || "bg-gray-300"}`} />
                            <select
                              value={inq.status}
                              onChange={e => handleStatusChange(inq.id, e.target.value)}
                              className={`pl-1 pr-6 py-1 rounded-md border text-xs font-semibold cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-all ${STATUS_STYLES[inq.status] || "bg-gray-50 border-gray-200 text-gray-600"}`}
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Pending">Pending</option>
                              <option value="Maybe">Maybe</option>
                            </select>
                          </div>
                        </td>

                        {/* Feedback 1 — NEW */}
                        <td className="px-4 py-3 max-w-[130px]">
                          <p className="text-gray-600 text-xs truncate" title={inq.feedback1}>
                            {inq.feedback1 || <span className="text-gray-300 italic">—</span>}
                          </p>
                        </td>

                        {/* Feedback 2 — NEW */}
                        <td className="px-4 py-3 max-w-[130px]">
                          <p className="text-gray-600 text-xs truncate" title={inq.feedback2}>
                            {inq.feedback2 || <span className="text-gray-300 italic">—</span>}
                          </p>
                        </td>

                        {/* Notes — NEW */}
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-gray-500 text-xs truncate leading-snug" title={inq.notes}>
                            {inq.notes || <span className="text-gray-300 italic">—</span>}
                          </p>
                        </td>

                        {/* Inquiry Date — renamed from Date */}
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {inq.created_at
                            ? new Date(inq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(inq)}
                            className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors whitespace-nowrap">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-gray-400 text-xs">
                Showing {filtered.length} of {inquiries.length} inquiries
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          SLIDE-IN DRAWER — Add Inquiry
      ══════════════════════════════════════════════ */}
      {drawerMounted && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm fade-in-bg" onClick={closeDrawer} />
          <div className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[500px] bg-white shadow-2xl flex flex-col ${drawerOpen ? "drawer-in" : "drawer-out"}`}>

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-5 bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">Add New Inquiry</h3>
                  <p className="text-gray-400 text-xs">Fill in the student details below</p>
                </div>
              </div>
              <button onClick={closeDrawer}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="shrink-0 h-1 bg-gray-100">
              <div className="h-full bg-[#2563EB] transition-all duration-500"
                style={{ width: formLoading ? "75%" : formSuccess ? "100%" : "0%" }} />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {formSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formError}
                </div>
              )}

              {/* Basic Details */}
              <FormSection title="Basic Details" color="blue">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Student Name *" className="col-span-2">
                    <input name="name" value={formData.name} onChange={handleFormChange}
                      placeholder="Full name" className={inputCls} />
                  </FormField>
                  <FormField label="Date of Birth">
                    <input name="dob" type="date" value={formData.dob} onChange={handleFormChange} className={inputCls} />
                  </FormField>
                  <FormField label="Gender">
                    <select name="sex" value={formData.sex} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormField>
                  <FormField label="Student Contact *">
                    <input name="phone" value={formData.phone} onChange={handleFormChange}
                      placeholder="10-digit mobile" className={inputCls} />
                  </FormField>
                  <FormField label="Parent Contact">
                    <input name="father_phone" value={formData.father_phone} onChange={handleFormChange}
                      placeholder="Parent mobile" className={inputCls} />
                  </FormField>
                  <FormField label="Father's Name">
                    <input name="father_name" value={formData.father_name} onChange={handleFormChange}
                      placeholder="Father's full name" className={inputCls} />
                  </FormField>
                  <FormField label="Email">
                    <input name="email" type="email" value={formData.email} onChange={handleFormChange}
                      placeholder="student@email.com" className={inputCls} />
                  </FormField>
                  {/* NEW: Branch */}
                  <FormField label="Branch">
                    <select name="branch" value={formData.branch} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select Branch</option>
                      <option value="Main Branch">Main Branch</option>
                      <option value="Branch A">Branch A</option>
                      <option value="Branch B">Branch B</option>
                      <option value="Online">Online</option>
                    </select>
                  </FormField>
                  <FormField label="Address" className="col-span-2">
                    <textarea name="address" value={formData.address} onChange={handleFormChange}
                      placeholder="Full address" rows={2} className={`${inputCls} resize-none`} />
                  </FormField>
                </div>
              </FormSection>

              {/* Academic Details */}
              <FormSection title="Academic Details" color="green">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Standard *">
                    <select name="standard" value={formData.standard} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select</option>
                      {["8th","9th","10th","11th","12th","Dropper","Other"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Batch">
                    <select name="course" value={formData.course} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </FormField>
                  <FormField label="Last Exam Marks">
                    <input name="last_exam_marks" value={formData.last_exam_marks} onChange={handleFormChange}
                      placeholder="e.g. 85%" className={inputCls} />
                  </FormField>
                  <FormField label="College Timing">
                    <input name="college_timing" value={formData.college_timing} onChange={handleFormChange}
                      placeholder="e.g. 7AM – 12PM" className={inputCls} />
                  </FormField>
                  <FormField label="College Name" className="col-span-2">
                    <input name="college_name" value={formData.college_name} onChange={handleFormChange}
                      placeholder="Current college / school" className={inputCls} />
                  </FormField>
                  <FormField label="Future Plans" className="col-span-2">
                    <input name="future_plans" value={formData.future_plans} onChange={handleFormChange}
                      placeholder="e.g. JEE, NEET, MHT-CET" className={inputCls} />
                  </FormField>
                </div>
              </FormSection>

              {/* Family & Other Info */}
              <FormSection title="Family & Other Info" color="orange">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Father's Occupation">
                    <input name="father_occupation" value={formData.father_occupation} onChange={handleFormChange}
                      placeholder="e.g. Business" className={inputCls} />
                  </FormField>
                  <FormField label="Mother's Occupation">
                    <input name="mother_occupation" value={formData.mother_occupation} onChange={handleFormChange}
                      placeholder="e.g. Homemaker" className={inputCls} />
                  </FormField>
                  <FormField label="Sibling Name">
                    <input name="sibling_name" value={formData.sibling_name} onChange={handleFormChange}
                      placeholder="If any" className={inputCls} />
                  </FormField>
                  <FormField label="Reference">
                    <select name="reference" value={formData.reference} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select</option>
                      {["Social Media (Instagram/Facebook)","Google","Hoarding","Website","Justdial","Friends","Pamphlets","Other"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Taking Coaching">
                    <select name="taking_coaching" value={formData.taking_coaching} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </FormField>
                  <FormField label="Hostel Required">
                    <select name="hostel_required" value={formData.hostel_required} onChange={handleFormChange} className={inputCls}>
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </FormField>
                </div>
              </FormSection>

              {/* NEW: Follow-up & Feedback */}
              <FormSection title="Follow-up & Feedback" color="purple">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Status">
                    <select name="status" value={formData.status} onChange={handleFormChange} className={inputCls}>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Maybe">Maybe</option>
                    </select>
                  </FormField>
                  <FormField label="Feedback 1">
                    <input name="feedback1" value={formData.feedback1} onChange={handleFormChange}
                      placeholder="First call feedback" className={inputCls} />
                  </FormField>
                  <FormField label="Feedback 2">
                    <input name="feedback2" value={formData.feedback2} onChange={handleFormChange}
                      placeholder="Second call feedback" className={inputCls} />
                  </FormField>
                  <FormField label="Notes" className="col-span-2">
                    <textarea name="notes" value={formData.notes} onChange={handleFormChange}
                      placeholder="Additional notes about this inquiry..." rows={3}
                      className={`${inputCls} resize-none`} />
                  </FormField>
                </div>
              </FormSection>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <p className="text-gray-400 text-xs">
                <span className="text-red-400 font-bold">*</span> Required fields
              </p>
              <div className="flex items-center gap-2">
                <button onClick={closeDrawer} disabled={formLoading}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleAddSubmit} disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  {formLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Inquiry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── View Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-900 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selected.studentName?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{selected.studentName}</h3>
                  <p className="text-gray-400 text-xs">{selected.standard} · {selected.batch} · {selected.branch}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Status pill in modal header */}
                <span className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${STATUS_STYLES[selected.status] || "bg-gray-50 border-gray-200 text-gray-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[selected.status] || "bg-gray-400"}`} />
                  {selected.status}
                </span>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <InfoGroup title="Basic Details" color="blue">
                <InfoRow label="Student Name"    value={selected.studentName} />
                <InfoRow label="Date of Birth"   value={selected.dob || "—"} />
                <InfoRow label="Gender"          value={selected.sex || "—"} />
                <InfoRow label="Student Contact" value={selected.studentContact} />
                <InfoRow label="Parent Contact"  value={selected.parentContact} />
                <InfoRow label="Email"           value={selected.email || "—"} />
                <InfoRow label="Branch"          value={selected.branch || "—"} />   {/* NEW */}
              </InfoGroup>
              <InfoGroup title="Academic Details" color="green">
                <InfoRow label="Standard"        value={selected.standard} />
                <InfoRow label="Batch"           value={selected.batch} />
                <InfoRow label="Last Exam Marks" value={selected.lastExamMarks || "—"} />
                <InfoRow label="College Name"    value={selected.collegeName || "—"} />
                <InfoRow label="College Timing"  value={selected.collegeTiming || "—"} />
                <InfoRow label="Future Plans"    value={selected.futurePlans || "—"} />
              </InfoGroup>
              <InfoGroup title="Family & Contact" color="orange">
                <InfoRow label="Father's Occupation" value={selected.fatherOccupation || "—"} />
                <InfoRow label="Mother's Occupation" value={selected.motherOccupation || "—"} />
                <InfoRow label="Address"             value={selected.address} />
                <InfoRow label="Sibling Name"        value={selected.siblingName || "—"} />
              </InfoGroup>
              <InfoGroup title="Follow-up & Feedback" color="purple">   {/* NEW group */}
                <InfoRow label="Status"     value={selected.status || "—"} />
                <InfoRow label="Feedback 1" value={selected.feedback1 || "—"} />
                <InfoRow label="Feedback 2" value={selected.feedback2 || "—"} />
                <InfoRow label="Notes"      value={selected.notes || "—"} />
              </InfoGroup>
              <InfoGroup title="Other Info" color="dark">
                <InfoRow label="Reference"       value={selected.reference || "—"} />
                <InfoRow label="Taking Coaching" value={selected.takingCoaching || "—"} />
                <InfoRow label="Hostel Required" value={selected.hostelRequired || "—"} />
                <InfoRow label="Inquiry Date"    value={
                  selected.created_at
                    ? new Date(selected.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                    : "—"
                } />
              </InfoGroup>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Shared input class ── */
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"

function FormSection({ title, color, children }: {
  title: string; color: string; children: React.ReactNode
}) {
  const styles: Record<string, string> = {
    blue:   "bg-[#2563EB] text-white",
    green:  "bg-[#16A34A] text-white",
    orange: "bg-[#EA580C] text-white",
    purple: "bg-[#7C3AED] text-white",   // NEW
  }
  return (
    <div className="space-y-3">
      <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase ${styles[color]}`}>
        {title}
      </div>
      {children}
    </div>
  )
}

function FormField({ label, children, className = "" }: {
  label: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-gray-500 text-xs font-medium">{label}</label>
      {children}
    </div>
  )
}

function InfoGroup({ title, color, children }: {
  title: string; color: string; children: React.ReactNode
}) {
  const styles: Record<string, string> = {
    blue:   "bg-[#2563EB] text-white",
    green:  "bg-[#16A34A] text-white",
    orange: "bg-[#EA580C] text-white",
    purple: "bg-[#7C3AED] text-white",   // NEW
    dark:   "bg-gray-900 text-white",
  }
  return (
    <div className="space-y-2">
      <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase ${styles[color]}`}>
        {title}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="text-gray-900 text-sm font-semibold break-words">{value}</p>
    </div>
  )
}