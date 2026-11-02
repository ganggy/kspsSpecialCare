import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BadgeCheck,
  BedDouble,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  HeartHandshake,
  Info,
  KeyRound,
  Layers,
  LogOut,
  MapPin,
  Microscope,
  Moon,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Ticket,
  Trash2,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';

type RightCategory = 'OFC' | 'LGO' | 'UCS' | 'SSS' | 'CASH';

interface RightPricingRule {
  rightCategory: RightCategory;
  rightName: string;
  isEligible: boolean;
  claimableAmount: number;
  copayAmount: number;
  privilegeNote: string;
}

interface PackageScheduleSlot {
  id: string;
  label: string;
  daysOfWeek: number[];
  specificDate?: string | null;
  startTime: string;
  endTime: string;
  maxQuota: number;
  roomName: string;
  providerName: string;
  isActive: boolean;
}

interface ServiceUnit {
  id: string;
  code: string;
  hosxpDepcode: string;
  name: string;
  shortName: string;
  description: string;
  location: string;
  contactPhone: string;
  iconName: string;
  themeColor: string;
  isActive: boolean;
}

interface SpecialPackage {
  id: string;
  code: string;
  unitId: string;
  hosxpDepcode: string;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  basePrice: number;
  specialClinicFee: number;
  inclusions: string[];
  preparation: string;
  rightsPricing: RightPricingRule[];
  schedules: PackageScheduleSlot[];
  isActive: boolean;
}

interface SpecialBooking {
  id: string;
  queueNumber: string;
  packageId: string;
  packageTitle: string;
  unitId: string;
  unitName: string;
  scheduleId: string;
  scheduleLabel: string;
  bookingDate: string;
  timeWindow: string;
  roomName: string;
  patientCid: string;
  patientHn: string | null;
  patientName: string;
  patientPhone: string;
  rightCategory: RightCategory;
  pttypeCode: string;
  pttypeName: string;
  basePrice: number;
  claimableAmount: number;
  netPayAmount: number;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  bookingChannel: 'THAID_ONLINE' | 'WEB_SELF' | 'STAFF_DESK';
  clinicalNote: string;
  createdAt: string;
}

interface PatientRightProfile {
  foundInHosxp: boolean;
  hn: string | null;
  cid: string;
  fullName: string;
  phone: string;
  pttypeCode: string;
  pttypeName: string;
  hipdataCode: string;
  rightCategory: RightCategory;
  rightLabel: string;
  lastVisitDate: string | null;
}

interface ThaIDSessionUser {
  sessionId: string;
  authenticatedVia: 'THAID_OAUTH2' | 'THAID_PID_VERIFY';
  pid: string;
  fullName: string;
  hosxpProfile: PatientRightProfile | null;
  authenticatedAt: string;
}

const RIGHT_META: Record<
  RightCategory,
  {
    label: string;
    short: string;
    desc: string;
    badgeLight: string;
    badgeDark: string;
  }
> = {
  OFC: {
    label: 'สิทธิข้าราชการ / กรมบัญชีกลาง (OFC)',
    short: 'ข้าราชการ (OFC)',
    desc: 'เบิกจ่ายตรงตามเกณฑ์กรมบัญชีกลาง',
    badgeLight: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeDark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  LGO: {
    label: 'สิทธิข้าราชการท้องถิ่น / อปท. (LGO)',
    short: 'อปท. (LGO)',
    desc: 'เบิกจ่ายตรงกองทุนสวัสดิการ อปท.',
    badgeLight: 'bg-purple-100 text-purple-900 border-purple-300',
    badgeDark: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  UCS: {
    label: 'สิทธิบัตรทอง 30 บาท (UCS)',
    short: 'บัตรทอง (UCS)',
    desc: 'สิทธิหลักประกันสุขภาพแห่งชาติ',
    badgeLight: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  SSS: {
    label: 'สิทธิประกันสังคม (SSS)',
    short: 'ประกันสังคม (SSS)',
    desc: 'ผู้ประกันตนตามมาตรา 33 / 39',
    badgeLight: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeDark: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  CASH: {
    label: 'ชำระเงินเอง (Self-Pay / Cash)',
    short: 'ชำระเงินเอง',
    desc: 'อัตราเหมาจ่ายประหยัดพิเศษ',
    badgeLight: 'bg-slate-200 text-slate-800 border-slate-300',
    badgeDark: 'bg-slate-700/60 text-slate-200 border-slate-600',
  },
};

const UNIT_STYLE: Record<
  string,
  {
    gradient: string;
    lightBg: string;
    lightText: string;
    darkBadge: string;
    tag: string;
  }
> = {
  'UNIT-OPD': {
    gradient: 'from-emerald-600 to-teal-600',
    lightBg: 'bg-emerald-50 border-emerald-200',
    lightText: 'text-emerald-800',
    darkBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tag: 'คลินิกยอดนิยม • Fast Track',
  },
  'UNIT-TTM': {
    gradient: 'from-amber-600 to-orange-600',
    lightBg: 'bg-amber-50 border-amber-200',
    lightText: 'text-amber-900',
    darkBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    tag: 'ผ่อนคลาย & ฟื้นฟูสุขภาพ',
  },
  'UNIT-DENT': {
    gradient: 'from-cyan-600 to-blue-600',
    lightBg: 'bg-cyan-50 border-cyan-200',
    lightText: 'text-cyan-900',
    darkBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    tag: 'ไม่ต้องรอคิวในเวลาราชการ',
  },
  'UNIT-PT': {
    gradient: 'from-violet-600 to-purple-600',
    lightBg: 'bg-violet-50 border-violet-200',
    lightText: 'text-violet-900',
    darkBadge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    tag: 'เครื่องมือเลเซอร์ & อัลตราซาวด์',
  },
  'UNIT-LAB': {
    gradient: 'from-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50 border-blue-200',
    lightText: 'text-blue-900',
    darkBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    tag: 'รู้ผลไวภายใน 2 ชั่วโมง',
  },
  'UNIT-VIP': {
    gradient: 'from-rose-600 to-pink-600',
    lightBg: 'bg-rose-50 border-rose-200',
    lightText: 'text-rose-900',
    darkBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    tag: 'ห้องพักเดี่ยว VIP ตึกร่มโพธิ์ 84 ปี',
  },
};

const DAY_NAMES_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export default function App() {
  // Default to 'light' for welcoming hospital readability; user can toggle anytime
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    localStorage.removeItem('ksps_special_care_theme');
    const saved = localStorage.getItem('ksps_theme_mode_v2');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'packages' | 'queues' | 'unit-admin' | 'revenue'>('packages');
  const [units, setUnits] = useState<ServiceUnit[]>([]);
  const [packages, setPackages] = useState<SpecialPackage[]>([]);
  const [bookings, setBookings] = useState<SpecialBooking[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  // Filters
  const [selectedUnitId, setSelectedUnitId] = useState<string>('ALL');
  const [previewRight, setPreviewRight] = useState<RightCategory>('OFC');
  const [queueFilterDate, setQueueFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [queueFilterUnit, setQueueFilterUnit] = useState<string>('ALL');
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Authenticated Patient / User
  const [currentUser, setCurrentUser] = useState<ThaIDSessionUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [verifyCidInput, setVerifyCidInput] = useState<string>('');
  const [verifyNameInput, setVerifyNameInput] = useState<string>('');
  const [verifyPhoneInput, setVerifyPhoneInput] = useState<string>('');
  const [thaidScopeOption, setThaidScopeOption] = useState<string>('openid pid given_name middle_name family_name');
  const [authStatusMsg, setAuthStatusMsg] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(
    null
  );

  // Booking Modal State
  const [bookingPkg, setBookingPkg] = useState<SpecialPackage | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [bookingCid, setBookingCid] = useState<string>('');
  const [bookingHn, setBookingHn] = useState<string>('');
  const [bookingName, setBookingName] = useState<string>('');
  const [bookingPhone, setBookingPhone] = useState<string>('');
  const [bookingRight, setBookingRight] = useState<RightCategory>('OFC');
  const [bookingNote, setBookingNote] = useState<string>('');
  const [createdSlip, setCreatedSlip] = useState<SpecialBooking | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  // Unit & Schedule Admin State
  const [adminUnitId, setAdminUnitId] = useState<string>('UNIT-OPD');
  const [newPkgTitle, setNewPkgTitle] = useState<string>('');
  const [newPkgSubtitle, setNewPkgSubtitle] = useState<string>('');
  const [newPkgCode, setNewPkgCode] = useState<string>('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(600);
  const [newPkgFee, setNewPkgFee] = useState<number>(150);
  const [newPkgDuration, setNewPkgDuration] = useState<number>(45);
  const [newPkgInclusions, setNewPkgInclusions] = useState<string>(
    'ตรวจประเมินโดยแพทย์/ผู้เชี่ยวชาญเฉพาะทาง\nช่องทางด่วนพิเศษไม่ต้องรอคิวปกติ'
  );
  const [newPkgPrep, setNewPkgPrep] = useState<string>('นำบัตรประชาชน หรือเปิดแอป ThaID มายืนยันก่อนเวลานัด 10 นาที');

  // Schedule Adder State
  const [schedPkgId, setSchedPkgId] = useState<string>('PKG-OPD-01');
  const [schedLabel, setSchedLabel] = useState<string>('คลินิกบริการพิเศษนอกเวลา');
  const [schedDays, setSchedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [schedSpecificDate, setSchedSpecificDate] = useState<string>('');
  const [schedStart, setSchedStart] = useState<string>('16:30');
  const [schedEnd, setSchedEnd] = useState<string>('19:30');
  const [schedQuota, setSchedQuota] = useState<number>(12);
  const [schedRoom, setSchedRoom] = useState<string>('ห้องตรวจพิเศษ 1');
  const [schedProvider, setSchedProvider] = useState<string>('ทีมแพทย์และพยาบาลเวรคลินิกพิเศษ');

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('ksps_theme_mode_v2', next);
      return next;
    });
  };

  const fetchCatalogAndHealth = async () => {
    try {
      const [catRes, healthRes] = await Promise.all([fetch('/api/catalog'), fetch('/api/health')]);
      const catData = await catRes.json();
      const healthData = await healthRes.json();

      if (catData.ok) {
        setUnits(catData.units || []);
        setPackages(catData.packages || []);
        setBookings(catData.bookings || []);
        setAnalytics(catData.analytics || null);
      }
      setHealth(healthData);
    } catch (err) {
      console.error('Error loading catalog:', err);
    }
  };

  useEffect(() => {
    fetchCatalogAndHealth();

    const savedUserRaw = localStorage.getItem('ksps_special_care_user');
    if (savedUserRaw) {
      try {
        const parsed = JSON.parse(savedUserRaw) as ThaIDSessionUser;
        setCurrentUser(parsed);
        if (parsed.hosxpProfile?.rightCategory) {
          setPreviewRight(parsed.hosxpProfile.rightCategory);
        }
      } catch {
        // ignore
      }
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
      setAuthStatusMsg({
        type: 'error',
        text: `การยืนยันตัวตน ThaID ถูกยกเลิกหรือแจ้งข้อผิดพลาด: ${params.get('error_description') || errorParam}`,
      });
      setShowAuthModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      setAuthStatusMsg({ type: 'info', text: 'กำลังตรวจสอบข้อมูลยืนยันตัวตนจากระบบ ThaID และดึงสิทธิ์จาก HOSxP...' });
      setShowAuthModal(true);

      fetch('/api/auth/thaid/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('ksps_special_care_user', JSON.stringify(data.user));
            if (data.user.hosxpProfile?.rightCategory) {
              setPreviewRight(data.user.hosxpProfile.rightCategory);
            }
            setAuthStatusMsg({
              type: 'success',
              text: `ยืนยันตัวตนผ่าน ThaID สำเร็จ: ${data.user.fullName}`,
            });
          } else {
            setAuthStatusMsg({
              type: 'error',
              text: data.error || 'ไม่สามารถแลกเปลี่ยน Token กับระบบ ThaID ได้',
            });
          }
        })
        .catch((err) => {
          setAuthStatusMsg({
            type: 'error',
            text: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ ThaID',
          });
        })
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  useEffect(() => {
    if (!bookingPkg) return;
    fetch(`/api/availability?packageId=${encodeURIComponent(bookingPkg.id)}&date=${encodeURIComponent(bookingDate)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.slots)) {
          setAvailableSlots(data.slots);
          const firstOpen = data.slots.find((s: any) => s.isAvailable) || data.slots[0];
          if (firstOpen) {
            setSelectedScheduleId(firstOpen.id);
          }
        }
      })
      .catch(() => setAvailableSlots([]));
  }, [bookingPkg, bookingDate]);

  const handleStartThaIDRedirect = async () => {
    try {
      setAuthStatusMsg({ type: 'info', text: 'กำลังเชื่อมต่อไปยังระบบพิสูจน์และยืนยันตัวตน ThaID (กรมการปกครอง)...' });
      const res = await fetch(`/api/auth/thaid/url?scope=${encodeURIComponent(thaidScopeOption)}`);
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setAuthStatusMsg({ type: 'error', text: 'ไม่สามารถสร้างลิงก์เชื่อมต่อ ThaID ได้' });
      }
    } catch (err: any) {
      setAuthStatusMsg({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาดในการเรียก ThaID' });
    }
  };

  const handleVerifyCidWithHosxp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCidInput.trim()) return;
    setAuthStatusMsg({ type: 'info', text: 'กำลังค้นหาข้อมูลผู้ป่วยและสิทธิ์การรักษาจากฐานข้อมูล HOSxP...' });
    try {
      const res = await fetch('/api/auth/patient/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cidOrHn: verifyCidInput.trim(),
          fullName: verifyNameInput.trim(),
          phone: verifyPhoneInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('ksps_special_care_user', JSON.stringify(data.user));
        if (data.user.hosxpProfile?.rightCategory) {
          setPreviewRight(data.user.hosxpProfile.rightCategory);
        }
        setAuthStatusMsg({
          type: 'success',
          text: data.user.hosxpProfile
            ? `พบประวัติใน HOSxP: ${data.user.fullName} (HN: ${data.user.hosxpProfile.hn}) — สิทธิ์: ${data.user.hosxpProfile.pttypeName}`
            : `เข้าสู่ระบบสำเร็จ: ${data.user.fullName} (ผู้รับบริการใหม่)`,
        });
      } else {
        setAuthStatusMsg({ type: 'error', text: data.error || 'ไม่พบข้อมูล' });
      }
    } catch (err: any) {
      setAuthStatusMsg({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาด' });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ksps_special_care_user');
    setAuthStatusMsg(null);
  };

  const openBookingModal = (pkg: SpecialPackage) => {
    setCreatedSlip(null);
    setBookingPkg(pkg);
    setBookingDate(new Date().toISOString().slice(0, 10));
    setBookingCid(currentUser?.pid || currentUser?.hosxpProfile?.cid || '');
    setBookingHn(currentUser?.hosxpProfile?.hn || '');
    setBookingName(currentUser?.fullName || '');
    setBookingPhone(currentUser?.hosxpProfile?.phone || '');
    setBookingRight(currentUser?.hosxpProfile?.rightCategory || previewRight || 'OFC');
    setBookingNote('');
  };

  const handleLookupInBookingModal = async () => {
    const q = bookingCid.trim() || bookingHn.trim();
    if (!q) return;
    const res = await fetch(`/api/hosxp/patient?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (data.ok && data.profile) {
      const p: PatientRightProfile = data.profile;
      setBookingCid(p.cid || bookingCid);
      setBookingHn(p.hn || '');
      setBookingName(p.fullName || bookingName);
      setBookingPhone(p.phone || bookingPhone);
      setBookingRight(p.rightCategory || 'UCS');
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPkg || !selectedScheduleId || !bookingName.trim()) return;
    setSubmittingBooking(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: bookingPkg.id,
          scheduleId: selectedScheduleId,
          bookingDate,
          patientCid: bookingCid.trim(),
          patientHn: bookingHn.trim() || null,
          patientName: bookingName.trim(),
          patientPhone: bookingPhone.trim(),
          rightCategory: bookingRight,
          bookingChannel: currentUser?.authenticatedVia === 'THAID_OAUTH2' ? 'THAID_ONLINE' : 'WEB_SELF',
          clinicalNote: bookingNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.booking) {
        setCreatedSlip(data.booking);
        await fetchCatalogAndHealth();
      } else {
        alert(data.error || 'ไม่สามารถจองคิวได้');
      }
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการจองคิว');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: SpecialBooking['status']) => {
    await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchCatalogAndHealth();
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgTitle.trim()) return;
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: adminUnitId,
        code: newPkgCode.trim() || `SPC-${Date.now().toString().slice(-4)}`,
        title: newPkgTitle.trim(),
        subtitle: newPkgSubtitle.trim(),
        description: newPkgSubtitle.trim(),
        basePrice: Number(newPkgPrice),
        specialClinicFee: Number(newPkgFee),
        durationMinutes: Number(newPkgDuration),
        inclusions: newPkgInclusions.split('\n').map((s) => s.trim()).filter(Boolean),
        preparation: newPkgPrep.trim(),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setNewPkgTitle('');
      setNewPkgSubtitle('');
      setNewPkgCode('');
      await fetchCatalogAndHealth();
      if (data.package?.id) {
        setSchedPkgId(data.package.id);
      }
      alert('บันทึกแพ็กเกจบริการพิเศษใหม่เรียบร้อยแล้ว');
    }
  };

  const handleAddScheduleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedPkgId) return;
    const res = await fetch(`/api/packages/${schedPkgId}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: schedLabel.trim(),
        daysOfWeek: schedDays,
        specificDate: schedSpecificDate.trim() || null,
        startTime: schedStart,
        endTime: schedEnd,
        maxQuota: Number(schedQuota),
        roomName: schedRoom.trim(),
        providerName: schedProvider.trim(),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setSchedSpecificDate('');
      await fetchCatalogAndHealth();
      alert('เพิ่มตารางวัน-เวลาเปิดให้บริการพิเศษเรียบร้อยแล้ว');
    }
  };

  const handleDeleteScheduleSlot = async (pkgId: string, scheduleId: string) => {
    await fetch(`/api/packages/${pkgId}/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
    await fetchCatalogAndHealth();
  };

  const toggleSchedDay = (day: number) => {
    setSchedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((p) => p.isActive && (selectedUnitId === 'ALL' || p.unitId === selectedUnitId));
  }, [packages, selectedUnitId]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (queueFilterUnit !== 'ALL' && b.unitId !== queueFilterUnit) return false;
      if (queueFilterDate && b.bookingDate !== queueFilterDate) return false;
      if (queueSearch.trim()) {
        const q = queueSearch.toLowerCase();
        return (
          b.queueNumber.toLowerCase().includes(q) ||
          b.patientName.toLowerCase().includes(q) ||
          (b.patientHn || '').toLowerCase().includes(q) ||
          (b.patientCid || '').toLowerCase().includes(q) ||
          b.packageTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, queueFilterUnit, queueFilterDate, queueSearch]);

  const renderUnitIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Smile':
        return <Smile className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Microscope':
        return <Microscope className={className} />;
      case 'BedDouble':
        return <BedDouble className={className} />;
      default:
        return <Stethoscope className={className} />;
    }
  };

  const cardSurface = isLight
    ? 'bg-white border-slate-200/90 shadow-md shadow-slate-200/50 text-slate-900'
    : 'bg-slate-900 border-slate-800 shadow-xl shadow-black/30 text-slate-100';

  const subSurface = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-800'
    : 'bg-slate-950/70 border-slate-800 text-slate-200';

  const inputClass = isLight
    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
    : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Announcement Ribbon */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              เปิดให้บริการคลินิกพิเศษนอกเวลา & แพ็กเกจตรวจสุขภาพช่องทางด่วน (Fast Track) — ใช้สิทธิ์ข้าราชการ อปท. บัตรทอง ประกันสังคมได้
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-100 text-xs">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> โทรนัดหมาย: 042-766054
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.hosxp?.ok ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'
                }`}
              />
              เชื่อมฐานข้อมูล HOSxP อัตโนมัติ
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
          isLight ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-slate-900/95 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <HeartHandshake className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  ศูนย์บริการทางการแพทย์พิเศษ
                </h1>
                <span
                  className={`px-3 py-0.5 text-xs font-bold rounded-full border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  โรงพยาบาลโคกศรีสุพรรณ
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                KSPS Special Care & VIP Clinic — บริการประทับใจ สะดวก รวดเร็ว ทราบสิทธิ์เบิกจ่ายทันที
              </p>
            </div>
          </div>

          {/* Right Controls: Theme Toggle + ThaID Login */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isLight ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>โหมดมืด</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>โหมดสว่าง</span>
                </>
              )}
            </button>

            {currentUser ? (
              <div
                className={`flex items-center gap-3 border rounded-2xl px-4 py-2 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-slate-900'
                    : 'bg-slate-800/90 border-emerald-500/40 text-white'
                }`}
              >
                <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs sm:text-sm">
                  <div className="font-bold flex items-center gap-2">
                    <span>{currentUser.fullName}</span>
                    {currentUser.hosxpProfile?.hn && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-xs font-semibold">
                        HN: {currentUser.hosxpProfile.hn}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    {currentUser.hosxpProfile?.pttypeName || RIGHT_META[previewRight].label}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthStatusMsg(null);
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>เข้าสู่ระบบด้วย ThaID / เช็กสิทธิ์</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Bar */}
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto border-t pt-1 ${
            isLight ? 'border-slate-100' : 'border-slate-800/70'
          }`}
        >
          {[
            { id: 'packages', label: 'แพ็กเกจบริการพิเศษ & จองคิว', icon: Layers },
            {
              id: 'queues',
              label: `ตารางคิวนัดหมาย (${bookings.filter((b) => b.status !== 'CANCELLED').length})`,
              icon: CalendarCheck,
            },
            { id: 'unit-admin', label: 'สำหรับหน่วยบริการ: จัดการแพ็กเกจ & เวลาเปิดบริการ', icon: Settings },
            { id: 'revenue', label: 'รายงานรายได้เสริม & สถานะระบบ', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-3 transition whitespace-nowrap rounded-t-xl ${
                  active
                    ? isLight
                      ? 'border-b-2 border-emerald-600 text-emerald-800 bg-emerald-50/90'
                      : 'border-b-2 border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Welcome & 3-Step Guide + Right Selector */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Hero Card */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-amber-200 text-xs sm:text-sm font-semibold">
                <Award className="w-4 h-4" />
                <span>บริการทางการแพทย์มาตรฐานพิเศษ • ลดเวลารอคอย • ดูแลใกล้ชิด</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                จองคิวรับบริการพิเศษล่วงหน้า
                <br />
                พร้อมคำนวณสิทธิ์เบิกจ่ายอัตโนมัติ
              </h2>
              <p className="text-sm sm:text-base text-emerald-50/95 leading-relaxed max-w-2xl">
                เลือกหน่วยบริการที่ท่านต้องการ ไม่ว่าจะเป็น <strong>ตรวจสุขภาพประจำปีข้าราชการ</strong>,{' '}
                <strong>คลินิกนอกเวลาตอนเย็น-วันหยุด</strong>, <strong>นวดประคบสมุนไพร</strong>,{' '}
                <strong>ทันตกรรมพิเศษ</strong>, <strong>กายภาพบำบัดเลเซอร์</strong> หรือ{' '}
                <strong>จองห้องพิเศษ VIP</strong>
              </p>
            </div>

            {/* 3 Easy Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/15 relative z-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5">
                <div className="text-xs font-bold text-amber-300">ขั้นตอนที่ 1</div>
                <div className="text-sm font-bold mt-0.5">เช็กสิทธิ์ด้วย ThaID / CID</div>
                <div className="text-xs text-emerald-100 mt-0.5">ดึงข้อมูล HN และสิทธิ์จาก รพ. ทันที</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5">
                <div className="text-xs font-bold text-amber-300">ขั้นตอนที่ 2</div>
                <div className="text-sm font-bold mt-0.5">เลือกแพ็กเกจ & วันเวลา</div>
                <div className="text-xs text-emerald-100 mt-0.5">ดูยอดเบิกได้และส่วนเกินชัดเจน</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5">
                <div className="text-xs font-bold text-amber-300">ขั้นตอนที่ 3</div>
                <div className="text-sm font-bold mt-0.5">รับบัตรคิวดิจิทัล</div>
                <div className="text-xs text-emerald-100 mt-0.5">ยื่นรับบริการช่องทางด่วนได้ทันที</div>
              </div>
            </div>
          </div>

          {/* Right Selector Panel */}
          <div className={`lg:col-span-5 rounded-3xl border p-6 flex flex-col justify-between ${cardSurface}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-bold">
                    เลือกสิทธิ์การรักษาของท่านเพื่อดูราคา
                  </h3>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>ค้นหาสิทธิ์จาก HOSxP</span>
                </button>
              </div>

              <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                คลิกเลือกสิทธิ์ด้านล่าง ระบบจะแสดง <strong>ยอดที่เบิกได้</strong> และ{' '}
                <strong>ยอดชำระจริง</strong> ของทุกแพ็กเกจให้ทันที:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {(['OFC', 'LGO', 'UCS', 'SSS', 'CASH'] as RightCategory[]).map((rc) => {
                  const active = previewRight === rc;
                  const meta = RIGHT_META[rc];
                  return (
                    <button
                      key={rc}
                      onClick={() => setPreviewRight(rc)}
                      className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                        active
                          ? isLight
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-sm'
                            : 'bg-emerald-500/20 border-emerald-400 text-white'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      } ${rc === 'CASH' ? 'sm:col-span-2' : ''}`}
                    >
                      <div>
                        <div className="text-sm font-bold">{meta.short}</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {meta.desc}
                        </div>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
                isLight
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <div>
                <span className="font-medium">กำลังคำนวณสิทธิ์: </span>
                <strong className="font-bold">{RIGHT_META[previewRight].label}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* TAB 1: PACKAGES & BOOKING */}
        {activeTab === 'packages' && (
          <section className="space-y-7">
            {/* Unit Category Selector Cards */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>เลือกหน่วยบริการที่ต้องการรับบริการพิเศษ</span>
                </h3>
                <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  แสดง {filteredPackages.length} แพ็กเกจบริการ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <button
                  onClick={() => setSelectedUnitId('ALL')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    selectedUnitId === 'ALL'
                      ? isLight
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                        : 'bg-emerald-600 border-emerald-400 text-white'
                      : `${cardSurface} hover:border-emerald-500/50`
                  }`}
                >
                  <Layers className="w-6 h-6 mb-2" />
                  <div>
                    <div className="text-sm font-bold">ทุกหน่วยบริการ</div>
                    <div className="text-xs opacity-80">{packages.length} แพ็กเกจ</div>
                  </div>
                </button>

                {units.map((u) => {
                  const count = packages.filter((p) => p.unitId === u.id && p.isActive).length;
                  const active = selectedUnitId === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                        active
                          ? isLight
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                            : 'bg-emerald-600 border-emerald-400 text-white'
                          : `${cardSurface} hover:border-emerald-500/50`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        {renderUnitIcon(u.iconName, 'w-6 h-6')}
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                            active
                              ? 'bg-white/20 text-white'
                              : isLight
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count} รายการ
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold leading-snug">{u.shortName}</div>
                        <div className="text-[11px] opacity-75 truncate mt-0.5">{u.location}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Package Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPackages.map((pkg) => {
                const unit = units.find((u) => u.id === pkg.unitId);
                const uStyle = UNIT_STYLE[pkg.unitId] || UNIT_STYLE['UNIT-OPD'];
                const rightRule =
                  pkg.rightsPricing.find((r) => r.rightCategory === previewRight) ||
                  pkg.rightsPricing[0];

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition hover:-translate-y-0.5 ${cardSurface}`}
                  >
                    <div>
                      {/* Top Color Accent Strip & Department Header */}
                      <div className={`bg-gradient-to-r ${uStyle.gradient} px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-2`}>
                        <div className="flex items-center gap-2 font-bold text-sm">
                          {renderUnitIcon(unit?.iconName || 'Stethoscope', 'w-5 h-5 text-white')}
                          <span>{unit?.name || pkg.unitId}</span>
                        </div>
                        <span className="px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                          {uStyle.tag}
                        </span>
                      </div>

                      <div className="p-6 space-y-5">
                        {/* Title & Subtitle */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span
                              className={`px-2.5 py-0.5 rounded-md border ${
                                isLight ? uStyle.lightBg + ' ' + uStyle.lightText : uStyle.darkBadge
                              }`}
                            >
                              รหัสแพ็กเกจ: {pkg.code}
                            </span>
                            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              <Clock className="w-4 h-4 text-emerald-600" />
                              เวลาให้บริการประมาณ{' '}
                              {pkg.durationMinutes >= 1440
                                ? 'รายวัน (24 ชม.)'
                                : `${pkg.durationMinutes} นาที`}
                            </span>
                          </div>

                          <h4 className="text-xl sm:text-2xl font-extrabold leading-snug pt-1">
                            {pkg.title}
                          </h4>
                          <p
                            className={`text-sm sm:text-base font-semibold ${
                              isLight ? 'text-emerald-700' : 'text-emerald-300'
                            }`}
                          >
                            {pkg.subtitle}
                          </p>
                          <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            {pkg.description}
                          </p>
                        </div>

                        {/* Highlighted Price & Right Coverage Box */}
                        {rightRule && (
                          <div
                            className={`rounded-2xl p-4 sm:p-5 border-2 space-y-3 ${
                              isLight
                                ? 'bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/60 border-emerald-300'
                                : 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/40'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  isLight
                                    ? RIGHT_META[previewRight].badgeLight
                                    : RIGHT_META[previewRight].badgeDark
                                }`}
                              >
                                สิทธิ์ที่เลือก: {rightRule.rightName}
                              </span>
                              <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                คำนวณสิทธิ์อัตโนมัติ
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-1">
                              <div className={`p-3 rounded-xl border ${subSurface}`}>
                                <div className="text-xs font-medium opacity-75">ราคาเต็มปกติ</div>
                                <div className="text-lg sm:text-xl font-bold mt-0.5">
                                  {pkg.basePrice.toLocaleString()} <span className="text-xs font-normal">บาท</span>
                                </div>
                              </div>

                              <div
                                className={`p-3 rounded-xl border ${
                                  isLight
                                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                }`}
                              >
                                <div className="text-xs font-semibold">เบิกตามสิทธิ์ได้</div>
                                <div className="text-lg sm:text-xl font-extrabold mt-0.5">
                                  {rightRule.claimableAmount.toLocaleString()}{' '}
                                  <span className="text-xs font-normal">บาท</span>
                                </div>
                              </div>

                              <div
                                className={`p-3 rounded-xl border-2 ${
                                  isLight
                                    ? 'bg-amber-100/90 border-amber-400 text-amber-950'
                                    : 'bg-amber-500/20 border-amber-400 text-amber-200'
                                }`}
                              >
                                <div className="text-xs font-bold">จ่ายจริงเพียง</div>
                                <div className="text-xl sm:text-2xl font-extrabold mt-0.5">
                                  {rightRule.copayAmount.toLocaleString()}{' '}
                                  <span className="text-xs font-semibold">บาท</span>
                                </div>
                              </div>
                            </div>

                            <div className={`text-xs sm:text-sm flex items-start gap-2 pt-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>สิทธิประโยชน์:</strong> {rightRule.privilegeNote}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Inclusions List */}
                        <div className={`p-4 rounded-2xl border space-y-2 ${subSurface}`}>
                          <div className="text-sm font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>สิ่งที่ท่านจะได้รับในแพ็กเกจนี้:</span>
                          </div>
                          <ul className="grid grid-cols-1 gap-1.5 text-sm">
                            {pkg.inclusions.map((inc, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Available Days & Time Windows */}
                        <div className="space-y-2">
                          <div className="text-sm font-bold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <span>ตารางวันและเวลาที่เปิดให้บริการ:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {pkg.schedules.map((sch) => (
                              <div
                                key={sch.id}
                                className={`p-3 rounded-xl border text-xs sm:text-sm space-y-1 ${subSurface}`}
                              >
                                <div className="font-bold text-emerald-700 dark:text-emerald-400">
                                  {sch.label}
                                </div>
                                <div className="font-semibold">
                                  ⏰ เวลา {sch.startTime} - {sch.endTime} น. (รับ {sch.maxQuota} คิว/รอบ)
                                </div>
                                <div className="text-xs opacity-80">
                                  📅{' '}
                                  {sch.specificDate
                                    ? `เปิดวันที่เฉพาะกิจ: ${sch.specificDate}`
                                    : `เปิดทุกวัน: ${sch.daysOfWeek.map((d) => DAY_NAMES_SHORT[d]).join(' ')}`}
                                </div>
                                <div className="text-xs opacity-80 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{sch.roomName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer CTA */}
                    <div
                      className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-4 ${
                        isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/90 border-slate-800'
                      }`}
                    >
                      <div className={`text-xs max-w-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <strong className="font-semibold">การเตรียมตัว:</strong> {pkg.preparation}
                      </div>
                      <button
                        onClick={() => openBookingModal(pkg)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
                      >
                        <Ticket className="w-5 h-5" />
                        <span>จองคิวรับบริการนี้</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: QUEUES & APPOINTMENTS */}
        {activeTab === 'queues' && (
          <section className="space-y-5">
            <div className={`rounded-3xl border p-6 space-y-5 ${cardSurface}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6 text-emerald-600" />
                    <span>ตารางคิวนัดหมายรับบริการพิเศษ (Queue & Appointments)</span>
                  </h3>
                  <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    ตรวจสอบรายชื่อผู้จองคิวแยกตามวันที่ หน่วยบริการ และจัดการสถานะการเข้ารับบริการ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="date"
                    value={queueFilterDate}
                    onChange={(e) => setQueueFilterDate(e.target.value)}
                    className={`px-3.5 py-2 rounded-xl border text-sm ${inputClass}`}
                  />
                  <select
                    value={queueFilterUnit}
                    onChange={(e) => setQueueFilterUnit(e.target.value)}
                    className={`px-3.5 py-2 rounded-xl border text-sm ${inputClass}`}
                  >
                    <option value="ALL">ทุกหน่วยบริการ</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.shortName}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="ค้นหาเลขคิว / ชื่อ / HN..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      className={`pl-9 pr-3.5 py-2 rounded-xl border text-sm w-60 ${inputClass}`}
                    />
                  </div>
                  <button
                    onClick={() => setQueueFilterDate('')}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-medium ${subSurface}`}
                  >
                    แสดงทุกวัน
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                      <th className="py-3.5 px-3">หมายเลขคิว</th>
                      <th className="py-3.5 px-3">วันที่ / ช่วงเวลา</th>
                      <th className="py-3.5 px-3">ผู้รับบริการ (HN / โทรศัพท์)</th>
                      <th className="py-3.5 px-3">หน่วยบริการ & แพ็กเกจ</th>
                      <th className="py-3.5 px-3">สิทธิ์การรักษา</th>
                      <th className="py-3.5 px-3 text-right">เบิกได้ / จ่ายจริง</th>
                      <th className="py-3.5 px-3">สถานะ</th>
                      <th className="py-3.5 px-3 text-right">จัดการคิว</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-500">
                          ไม่พบรายการคิวนัดหมายตามเงื่อนไขที่เลือก
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                          <td className="py-3.5 px-3 font-mono font-extrabold text-emerald-600 text-base">
                            {b.queueNumber}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold">{b.bookingDate}</div>
                            <div className="text-xs opacity-80">{b.timeWindow} น.</div>
                            <div className="text-xs opacity-70">{b.roomName}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold">{b.patientName}</div>
                            <div className="text-xs opacity-80">
                              {b.patientHn ? `HN: ${b.patientHn}` : 'ผู้รับบริการใหม่'} • โทร: {b.patientPhone || '-'}
                            </div>
                            {b.clinicalNote && (
                              <div className="text-xs text-amber-600 font-medium mt-0.5">
                                หมายเหตุ: {b.clinicalNote}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {b.unitName}
                            </div>
                            <div className="text-xs opacity-90 line-clamp-1">{b.packageTitle}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                isLight
                                  ? RIGHT_META[b.rightCategory]?.badgeLight
                                  : RIGHT_META[b.rightCategory]?.badgeDark
                              }`}
                            >
                              {RIGHT_META[b.rightCategory]?.short || b.rightCategory}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="text-xs text-emerald-600 font-semibold">
                              เบิก: {b.claimableAmount.toLocaleString()} ฿
                            </div>
                            <div className="font-extrabold text-amber-600">
                              จ่าย: {b.netPayAmount.toLocaleString()} ฿
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                b.status === 'CONFIRMED'
                                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                                  : b.status === 'CHECKED_IN'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : b.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {b.status === 'CONFIRMED'
                                ? 'ยืนยันนัดหมาย'
                                : b.status === 'CHECKED_IN'
                                ? 'กำลังรับบริการ'
                                : b.status === 'COMPLETED'
                                ? 'เสร็จสิ้น'
                                : 'ยกเลิก'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold"
                              >
                                รับคิว
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                              >
                                เสร็จสิ้น
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: UNIT & SCHEDULE MANAGEMENT */}
        {activeTab === 'unit-admin' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Create Package */}
            <div className={`lg:col-span-6 rounded-3xl border p-6 space-y-4 ${cardSurface}`}>
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Plus className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold">
                    1. สร้างแพ็กเกจบริการพิเศษประจำหน่วยบริการ
                  </h3>
                  <p className="text-xs opacity-75">
                    หน่วยบริการสามารถเพิ่มแพ็กเกจ กำหนดราคา และค่าธรรมเนียมคลินิกพิเศษ
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreatePackage} className="space-y-3.5 text-sm">
                <div>
                  <label className="block font-semibold mb-1">เลือกหน่วยบริการเจ้าของแพ็กเกจ</label>
                  <select
                    value={adminUnitId}
                    onChange={(e) => setAdminUnitId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (รหัสแผนก HOSxP: {u.hosxpDepcode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">ชื่อแพ็กเกจบริการพิเศษ *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น คลินิกตรวจคัดกรองโรคไต/เบาหวานช่องทางด่วน"
                      value={newPkgTitle}
                      onChange={(e) => setNewPkgTitle(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">รหัสแพ็กเกจ</label>
                    <input
                      type="text"
                      placeholder="เช่น OPD-VIP-03"
                      value={newPkgCode}
                      onChange={(e) => setNewPkgCode(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">คำอธิบายจุดเด่นบริการ</label>
                  <input
                    type="text"
                    placeholder="เช่น ทราบผลแล็บใน 1 ชม. พร้อมพบแพทย์เฉพาะทางโดยไม่ต้องรอคิวปกติ"
                    value={newPkgSubtitle}
                    onChange={(e) => setNewPkgSubtitle(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">ราคาเต็ม (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ค่าคลินิกพิเศษ (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      value={newPkgFee}
                      onChange={(e) => setNewPkgFee(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">เวลาต่อคิว (นาที)</label>
                    <input
                      type="number"
                      min={10}
                      value={newPkgDuration}
                      onChange={(e) => setNewPkgDuration(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    รายการที่รวมในแพ็กเกจ (บรรทัดละ 1 รายการ)
                  </label>
                  <textarea
                    rows={3}
                    value={newPkgInclusions}
                    onChange={(e) => setNewPkgInclusions(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">คำแนะนำการเตรียมตัวก่อนรับบริการ</label>
                  <input
                    type="text"
                    value={newPkgPrep}
                    onChange={(e) => setNewPkgPrep(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
                >
                  + บันทึกแพ็กเกจบริการพิเศษใหม่
                </button>
              </form>
            </div>

            {/* Right Column: Schedule Slot Configurator */}
            <div className={`lg:col-span-6 rounded-3xl border p-6 space-y-4 ${cardSurface}`}>
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Calendar className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-lg font-bold">
                    2. กำหนดวันและช่วงเวลาเปิดรับบริการพิเศษ
                  </h3>
                  <p className="text-xs opacity-75">
                    กำหนดวันเปิดประจำสัปดาห์ หรือระบุวันที่เปิดเฉพาะกิจ พร้อมจำนวนคิวรับสูงสุด
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddScheduleSlot} className="space-y-3.5 text-sm">
                <div>
                  <label className="block font-semibold mb-1">เลือกแพ็กเกจที่ต้องการเพิ่มรอบเวลา</label>
                  <select
                    value={schedPkgId}
                    onChange={(e) => setSchedPkgId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">ชื่อรอบบริการ</label>
                    <input
                      type="text"
                      required
                      value={schedLabel}
                      onChange={(e) => setSchedLabel(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      วันที่เปิดเฉพาะกิจ (เว้นว่างหากเปิดประจำสัปดาห์)
                    </label>
                    <input
                      type="date"
                      value={schedSpecificDate}
                      onChange={(e) => setSchedSpecificDate(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">วันในสัปดาห์ที่เปิดให้บริการ</label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES_SHORT.map((dayLabel, idx) => {
                      const active = schedDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => toggleSchedDay(idx)}
                          className={`px-3.5 py-1.5 rounded-xl font-bold border transition ${
                            active
                              ? 'bg-amber-500 text-white border-amber-500'
                              : `${subSurface} opacity-70`
                          }`}
                        >
                          {dayLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      value={schedStart}
                      onChange={(e) => setSchedStart(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      value={schedEnd}
                      onChange={(e) => setSchedEnd(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">โควตา (คิว/รอบ)</label>
                    <input
                      type="number"
                      min={1}
                      value={schedQuota}
                      onChange={(e) => setSchedQuota(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">ห้องตรวจ / สถานที่</label>
                    <input
                      type="text"
                      value={schedRoom}
                      onChange={(e) => setSchedRoom(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ผู้ให้บริการ</label>
                    <input
                      type="text"
                      value={schedProvider}
                      onChange={(e) => setSchedProvider(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-md"
                >
                  + เพิ่มรอบวัน-เวลาเปิดรับบริการ
                </button>
              </form>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold">รอบเวลาที่เปิดอยู่ของแพ็กเกจนี้:</div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {packages
                    .find((p) => p.id === schedPkgId)
                    ?.schedules.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${subSurface}`}
                      >
                        <div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">{s.label}</div>
                          <div className="opacity-80">
                            {s.specificDate
                              ? `วันที่เฉพาะกิจ: ${s.specificDate}`
                              : s.daysOfWeek.map((d) => DAY_NAMES_SHORT[d]).join(' ')}{' '}
                            • {s.startTime}-{s.endTime} น. • รับ {s.maxQuota} คิว ({s.roomName})
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteScheduleSlot(schedPkgId, s.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: REVENUE ANALYTICS & SYSTEM STATUS */}
        {activeTab === 'revenue' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className={`p-5 rounded-3xl border ${cardSurface}`}>
                <div className="text-xs font-semibold opacity-70">คิวจองบริการพิเศษทั้งหมด</div>
                <div className="text-3xl font-extrabold mt-1">
                  {analytics?.activeBookingsCount || 0} คิว
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-1">นับเฉพาะคิวที่ยืนยันแล้ว</div>
              </div>
              <div className={`p-5 rounded-3xl border ${cardSurface}`}>
                <div className="text-xs font-semibold opacity-70">มูลค่าบริการรวม (Gross)</div>
                <div className="text-3xl font-extrabold mt-1">
                  {(analytics?.totalGrossRevenue || 0).toLocaleString()} ฿
                </div>
                <div className="text-xs opacity-70 mt-1">รวมทุกหน่วยบริการ</div>
              </div>
              <div className={`p-5 rounded-3xl border ${cardSurface}`}>
                <div className="text-xs font-semibold text-emerald-600">ยอดเบิกชดเชยตามสิทธิ์</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {(analytics?.totalClaimable || 0).toLocaleString()} ฿
                </div>
                <div className="text-xs opacity-70 mt-1">OFC / LGO / UCS / SSS</div>
              </div>
              <div className={`p-5 rounded-3xl border ${cardSurface}`}>
                <div className="text-xs font-semibold text-amber-600">รายได้บำรุงรับสุทธิ (Co-pay)</div>
                <div className="text-3xl font-extrabold text-amber-600 mt-1">
                  {(analytics?.totalNetPatientPay || 0).toLocaleString()} ฿
                </div>
                <div className="text-xs opacity-70 mt-1">ชำระส่วนเกิน/ชำระเอง</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`rounded-3xl border p-6 space-y-4 ${cardSurface}`}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <span>สรุปรายได้แยกตามหน่วยบริการ</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 opacity-75">
                        <th className="py-2.5">หน่วยบริการ</th>
                        <th className="py-2.5 text-center">จำนวนคิว</th>
                        <th className="py-2.5 text-right">เบิกตามสิทธิ์</th>
                        <th className="py-2.5 text-right">ชำระส่วนเกิน</th>
                        <th className="py-2.5 text-right">รวมทั้งหมด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {(analytics?.revenueByUnit || []).map((row: any) => (
                        <tr key={row.unitId}>
                          <td className="py-3 font-bold">{row.unitName}</td>
                          <td className="py-3 text-center">{row.bookingCount}</td>
                          <td className="py-3 text-right text-emerald-600 font-semibold">
                            {row.claimableRevenue.toLocaleString()} ฿
                          </td>
                          <td className="py-3 text-right text-amber-600 font-semibold">
                            {row.copayRevenue.toLocaleString()} ฿
                          </td>
                          <td className="py-3 text-right font-extrabold">
                            {row.grossRevenue.toLocaleString()} ฿
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`rounded-3xl border p-6 space-y-4 ${cardSurface}`}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <span>สถานะการเชื่อมต่อระบบ ThaID (DOPA) & HOSxP</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subSurface}`}>
                    <span className="opacity-75">Callback Endpoint (ThaID):</span>
                    <code className="font-mono font-bold text-emerald-600">
                      {health?.thaid?.callbackUrl || 'http://147.50.107.211:3601/'}
                    </code>
                  </div>
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subSurface}`}>
                    <span className="opacity-75">ThaID Client ID:</span>
                    <code className="font-mono font-bold text-indigo-600">
                      {health?.thaid?.clientIdPreview || 'MFloMmR5NG...'} (พร้อมใช้งาน)
                    </code>
                  </div>
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subSurface}`}>
                    <span className="opacity-75">ฐานข้อมูล HOSxP (Read-Only):</span>
                    <span className="font-bold text-emerald-600">
                      {health?.hosxp?.host || '192.168.2.254'} ({health?.hosxp?.latencyMs || 18} ms)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: THAID LOGIN & HOSXP VERIFICATION */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl ${cardSurface}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold">ยืนยันตัวตนด้วย ThaID & เช็กสิทธิ์</h3>
                  <p className="text-xs opacity-75">
                    เชื่อมต่อระบบกรมการปกครอง (DOPA) และฐานข้อมูล HOSxP รพ.โคกศรีสุพรรณ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authStatusMsg && (
              <div
                className={`p-4 rounded-2xl text-sm font-medium border ${
                  authStatusMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : authStatusMsg.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
                }`}
              >
                {authStatusMsg.text}
              </div>
            )}

            <div className={`p-4 rounded-2xl border space-y-3 ${subSurface}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  วิธีที่ 1: ยืนยันตัวตนผ่านแอป ThaID (OAuth 2.0)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 font-semibold">
                  Callback: 3601
                </span>
              </div>
              <div className="space-y-1">
                <label className="block text-xs opacity-75">Scope ข้อมูลที่ร้องขอจาก ThaID:</label>
                <select
                  value={thaidScopeOption}
                  onChange={(e) => setThaidScopeOption(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                >
                  <option value="openid pid given_name middle_name family_name">
                    มาตรฐาน: openid pid given_name middle_name family_name
                  </option>
                  <option value="openid given_name middle_name">
                    เฉพาะชื่อ-ชื่อกลาง: openid given_name middle_name
                  </option>
                  <option value="openid">เฉพาะรหัสยืนยันตัวตน: openid</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleStartThaIDRedirect}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>เข้าสู่ระบบด้วยแอป ThaID ทันที</span>
              </button>
            </div>

            <form
              onSubmit={handleVerifyCidWithHosxp}
              className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-sm"
            >
              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                วิธีที่ 2: ตรวจสอบสิทธิ์จาก HOSxP ด้วยเลขบัตรประชาชน 13 หลัก หรือ HN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs opacity-75 mb-1">เลขบัตรประชาชน 13 หลัก หรือ HN *</label>
                  <input
                    type="text"
                    required
                    placeholder="กรอกเลข 13 หลัก หรือ HN เพื่อดึงสิทธิ์อัตโนมัติ"
                    value={verifyCidInput}
                    onChange={(e) => setVerifyCidInput(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-75 mb-1">ชื่อ-นามสกุล (กรณีผู้ป่วยใหม่)</label>
                  <input
                    type="text"
                    placeholder="ระบบดึงจาก HOSxP อัตโนมัติถ้ามี HN"
                    value={verifyNameInput}
                    onChange={(e) => setVerifyNameInput(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-75 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="08x-xxx-xxxx"
                    value={verifyPhoneInput}
                    onChange={(e) => setVerifyPhoneInput(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
              >
                ตรวจสอบสิทธิ์จาก HOSxP & เข้าใช้งาน
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PACKAGE BOOKING & DIGITAL SLIP */}
      {bookingPkg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 ${cardSurface}`}>
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600">
                  จองคิวรับบริการพิเศษ • #{bookingPkg.code}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold">{bookingPkg.title}</h3>
              </div>
              <button
                onClick={() => setBookingPkg(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdSlip ? (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-3 text-center shadow-xl">
                  <BadgeCheck className="w-14 h-14 text-amber-300 mx-auto" />
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    ออกบัตรคิวรับบริการพิเศษสำเร็จ (Digital Queue Slip)
                  </div>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-wider">
                    คิวที่ {createdSlip.queueNumber}
                  </div>
                  <div className="text-base font-bold">{createdSlip.packageTitle}</div>

                  <div className="grid grid-cols-2 gap-3 text-left text-xs sm:text-sm bg-black/25 p-4 rounded-2xl mt-2">
                    <div>
                      <span className="text-emerald-100">ผู้รับบริการ:</span>
                      <div className="font-bold text-white">{createdSlip.patientName}</div>
                      {createdSlip.patientHn && <div>HN: {createdSlip.patientHn}</div>}
                    </div>
                    <div>
                      <span className="text-emerald-100">วันและเวลานัดหมาย:</span>
                      <div className="font-bold text-amber-300">
                        {createdSlip.bookingDate} ({createdSlip.timeWindow} น.)
                      </div>
                      <div>{createdSlip.roomName}</div>
                    </div>
                    <div>
                      <span className="text-emerald-100">สิทธิ์การรักษา:</span>
                      <div className="font-bold">{createdSlip.pttypeName}</div>
                    </div>
                    <div>
                      <span className="text-emerald-100">สรุปค่าใช้จ่าย:</span>
                      <div>เบิกตามสิทธิ์: {createdSlip.claimableAmount.toLocaleString()} บาท</div>
                      <div className="font-bold text-amber-300">
                        จ่ายจริง: {createdSlip.netPayAmount.toLocaleString()} บาท
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setBookingPkg(null);
                      setActiveTab('queues');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
                  >
                    ดูตารางคิวทั้งหมด
                  </button>
                  <button
                    onClick={() => setBookingPkg(null)}
                    className={`px-5 py-2.5 rounded-xl border text-sm font-semibold ${subSurface}`}
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">1. เลือกวันที่ต้องการรับบริการ *</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">2. เลือกช่วงเวลาที่เปิดรับบริการ *</label>
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                    >
                      {availableSlots.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.label} ({s.startTime}-{s.endTime} น.) — ว่าง {s.remainingQuota}/{s.maxQuota} คิว
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border space-y-3 ${subSurface}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      3. ข้อมูลผู้รับบริการ & สิทธิ์การรักษา
                    </span>
                    <button
                      type="button"
                      onClick={handleLookupInBookingModal}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      ดึงข้อมูลจาก HOSxP
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs opacity-75 mb-1">เลขบัตรประชาชน 13 หลัก</label>
                      <input
                        type="text"
                        placeholder="ระบุเลข 13 หลัก"
                        value={bookingCid}
                        onChange={(e) => setBookingCid(e.target.value)}
                        onBlur={handleLookupInBookingModal}
                        className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs opacity-75 mb-1">HN โรงพยาบาล (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="เช่น 0012458"
                        value={bookingHn}
                        onChange={(e) => setBookingHn(e.target.value)}
                        onBlur={handleLookupInBookingModal}
                        className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs opacity-75 mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                      <input
                        type="text"
                        required
                        placeholder="08x-xxx-xxxx"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs opacity-75 mb-1">ชื่อ - นามสกุล ผู้รับบริการ *</label>
                      <input
                        type="text"
                        required
                        placeholder="นาย/นาง/น.ส. ชื่อ นามสกุล"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs opacity-75 mb-1">สิทธิ์การรักษา *</label>
                      <select
                        value={bookingRight}
                        onChange={(e) => setBookingRight(e.target.value as RightCategory)}
                        className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                      >
                        {(['OFC', 'LGO', 'UCS', 'SSS', 'CASH'] as RightCategory[]).map((rc) => (
                          <option key={rc} value={rc}>
                            {RIGHT_META[rc].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs opacity-75 mb-1">
                      อาการเบื้องต้น / ความต้องการเพิ่มเติมแจ้งหน่วยบริการ
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ขอตรวจคลื่นหัวใจเพิ่ม, ปวดสะบักขวาเรื้อรัง, ต้องการใบรับรองแพทย์"
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                    />
                  </div>
                </div>

                {(() => {
                  const rule =
                    bookingPkg.rightsPricing.find((r) => r.rightCategory === bookingRight) ||
                    bookingPkg.rightsPricing[0];
                  return (
                    <div
                      className={`p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3 ${
                        isLight
                          ? 'bg-emerald-50 border-emerald-300 text-slate-900'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-white'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{rule?.rightName}</div>
                        <div className="text-xs opacity-80">{rule?.privilegeNote}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-600 font-semibold">
                          เบิกได้ตามสิทธิ์: {(rule?.claimableAmount || 0).toLocaleString()} บาท
                        </div>
                        <div className="text-lg font-extrabold text-amber-600">
                          ยอดชำระจริง: {(rule?.copayAmount ?? bookingPkg.basePrice).toLocaleString()} บาท
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingPkg(null)}
                    className={`px-5 py-2.5 rounded-xl border font-semibold ${subSurface}`}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition"
                  >
                    {submittingBooking ? 'กำลังออกบัตรคิว...' : 'ยืนยันการจองคิวรับบริการ'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
