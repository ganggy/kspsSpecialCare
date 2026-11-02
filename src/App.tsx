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
  Clock,
  CreditCard,
  FileText,
  Filter,
  HeartHandshake,
  KeyRound,
  Layers,
  LogOut,
  Microscope,
  Moon,
  Phone,
  Plus,
  RefreshCw,
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
  Users,
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

const RIGHT_BADGES: Record<
  RightCategory,
  { label: string; short: string; colorClass: string; borderClass: string }
> = {
  OFC: {
    label: 'สิทธิข้าราชการ / กรมบัญชีกลาง (OFC)',
    short: 'ข้าราชการ (OFC)',
    colorClass: 'bg-amber-500/20 text-amber-300',
    borderClass: 'border-amber-500/40',
  },
  LGO: {
    label: 'สิทธิข้าราชการส่วนท้องถิ่น / อปท. (LGO)',
    short: 'อปท. (LGO)',
    colorClass: 'bg-purple-500/20 text-purple-300',
    borderClass: 'border-purple-500/40',
  },
  UCS: {
    label: 'สิทธิบัตรทอง 30 บาท (UCS)',
    short: 'บัตรทอง (UCS)',
    colorClass: 'bg-emerald-500/20 text-emerald-300',
    borderClass: 'border-emerald-500/40',
  },
  SSS: {
    label: 'สิทธิประกันสังคม (SSS)',
    short: 'ประกันสังคม (SSS)',
    colorClass: 'bg-sky-500/20 text-sky-300',
    borderClass: 'border-sky-500/40',
  },
  CASH: {
    label: 'ชำระเงินเอง (Self-Pay / Cash)',
    short: 'ชำระเงินเอง',
    colorClass: 'bg-slate-500/20 text-slate-300',
    borderClass: 'border-slate-500/40',
  },
};

const DAY_NAMES_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ksps_special_care_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });
  const [activeTab, setActiveTab] = useState<'packages' | 'queues' | 'unit-admin' | 'revenue'>('packages');
  const [units, setUnits] = useState<ServiceUnit[]>([]);
  const [packages, setPackages] = useState<SpecialPackage[]>([]);
  const [bookings, setBookings] = useState<SpecialBooking[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    } finally {
      setLoading(false);
    }
  };

  // Restore Session & Handle ThaID OAuth2 Callback (?code=...&state=...)
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
        // ignore invalid localstorage
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

  // Load slot availability when booking modal package or date changes
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
            ? `พบข้อมูลใน HOSxP: ${data.user.fullName} (HN: ${data.user.hosxpProfile.hn}) — ${data.user.hosxpProfile.pttypeName}`
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

  const renderUnitIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-cyan-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-violet-400" />;
      case 'Microscope':
        return <Microscope className="w-5 h-5 text-blue-400" />;
      case 'BedDouble':
        return <BedDouble className="w-5 h-5 text-rose-400" />;
      default:
        return <Stethoscope className="w-5 h-5 text-emerald-400" />;
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ksps_special_care_theme', next);
      return next;
    });
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-200 ${
        theme === 'light' ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/60">
              <HeartHandshake className="w-6 h-6 text-white keep-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  KSPS Special Care
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  รพ.โคกศรีสุพรรณ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบแพ็กเกจบริการพิเศษ แยกตามหน่วยบริการ & จองคิวออนไลน์ตามสิทธิ์การรักษา (ThaID & HOSxP)
              </p>
            </div>
          </div>

          {/* Right Action Area: Theme Toggle, ThaID Login & HOSxP Status */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/70 text-xs font-medium text-slate-200 transition"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">โหมดสว่าง</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">โหมดมืด</span>
                </>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.hosxp?.ok ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300">
                HOSxP DB: {health?.hosxp?.ok ? `ออนไลน์ (${health.hosxp.latencyMs}ms)` : 'รอเชื่อมต่อ'}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-emerald-500/40 rounded-xl px-3 py-1.5">
                <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>{currentUser.fullName}</span>
                    {currentUser.hosxpProfile?.hn && (
                      <span className="px-1.5 py-0.2 bg-slate-700 rounded text-[11px] text-emerald-300">
                        HN: {currentUser.hosxpProfile.hn}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {currentUser.hosxpProfile?.pttypeName || RIGHT_BADGES[previewRight].label}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-950/50 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วย ThaID / ตรวจสอบสิทธิ์</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 pt-1">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'packages'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>แพ็กเกจบริการพิเศษ & จองคิว</span>
          </button>

          <button
            onClick={() => setActiveTab('queues')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'queues'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>ตารางคิวนัดหมาย ({bookings.filter((b) => b.status !== 'CANCELLED').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unit-admin')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'unit-admin'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>สำหรับหน่วยบริการ: จัดการแพ็กเกจ & วันเวลาเปิดบริการ</span>
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'revenue'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>รายงานรายได้เสริม & การเชื่อมต่อ ThaID</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Summary Banner & Right Selector */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <Award className="w-3.5 h-3.5" />
                <span>บริการทางการแพทย์ทางเลือก & คลินิกพิเศษเพิ่มรายได้โรงพยาบาล</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                เลือกแพ็กเกจบริการพิเศษตามหน่วยบริการ พร้อมคำนวณสิทธิ์เบิกจ่ายอัตโนมัติ
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                รองรับผู้รับบริการทั้ง <strong>สิทธิข้าราชการ (OFC)</strong>, <strong>สิทธิ อปท. (LGO)</strong>,{' '}
                <strong>สิทธิบัตรทอง (UCS)</strong>, <strong>สิทธิประกันสังคม (SSS)</strong> และชำระเงินเอง
                สามารถล็อกอินผ่านแอป <strong>ThaID</strong> เพื่อดึงข้อมูล HN และสิทธิ์การรักษาจากฐานข้อมูล HOSxP ได้ทันที
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>เปิดจองคิวล่วงหน้าออนไลน์ 24 ชม. หรือติดต่อหน้าจุดบริการทุกแผนก</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 transition"
                >
                  ตรวจสอบสิทธิ์ด้วยเลขบัตร 13 หลัก / HN
                </button>
              </div>
            </div>
          </div>

          {/* Right Comparison Switcher */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  เลือกสิทธิ์การรักษาเพื่อดูอัตราเบิกจ่าย/ส่วนเกิน
                </span>
                {currentUser?.hosxpProfile && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    ดึงจาก HOSxP แล้ว
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {(['OFC', 'LGO', 'UCS', 'SSS', 'CASH'] as RightCategory[]).map((rc) => {
                  const active = previewRight === rc;
                  return (
                    <button
                      key={rc}
                      onClick={() => setPreviewRight(rc)}
                      className={`px-3 py-2 rounded-xl text-left border transition ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{RIGHT_BADGES[rc].short}</div>
                      <div className="text-[10px] opacity-80 truncate">{rc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">กำลังแสดงเรทราคาสำหรับ: </span>
                <strong className="text-emerald-300">{RIGHT_BADGES[previewRight].label}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* TAB 1: PACKAGES & BOOKING */}
        {activeTab === 'packages' && (
          <section className="space-y-6">
            {/* Service Unit Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>เลือกหน่วยบริการ (Service Units)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  พบ {filteredPackages.length} แพ็กเกจที่เปิดให้บริการ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                <button
                  onClick={() => setSelectedUnitId('ALL')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedUnitId === 'ALL'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <div>
                    <div className="text-xs font-bold">ทุกหน่วยบริการ</div>
                    <div className="text-[11px] text-slate-400">{packages.length} แพ็กเกจ</div>
                  </div>
                </button>

                {units.map((u) => {
                  const count = packages.filter((p) => p.unitId === u.id && p.isActive).length;
                  const active = selectedUnitId === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        {renderUnitIcon(u.iconName)}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          dep:{u.hosxpDepcode}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold line-clamp-1">{u.shortName}</div>
                        <div className="text-[11px] text-slate-400">{count} แพ็กเกจ</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Package Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredPackages.map((pkg) => {
                const unit = units.find((u) => u.id === pkg.unitId);
                const rightRule =
                  pkg.rightsPricing.find((r) => r.rightCategory === previewRight) ||
                  pkg.rightsPricing[0];

                return (
                  <div
                    key={pkg.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="p-5 space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {unit?.shortName || pkg.unitId}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">#{pkg.code}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {pkg.durationMinutes >= 1440
                                ? 'รายวัน (24 ชม.)'
                                : `${pkg.durationMinutes} นาที`}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                            {pkg.title}
                          </h4>
                          <p className="text-xs text-emerald-300/90 font-medium">{pkg.subtitle}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{pkg.description}</p>

                      {/* Inclusions */}
                      <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                        <div className="text-xs font-semibold text-slate-300">
                          รายการที่ได้รับในแพ็กเกจ:
                        </div>
                        <ul className="grid grid-cols-1 gap-1 text-xs text-slate-300">
                          {pkg.inclusions.map((inc, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Schedule Windows defined by Unit */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>วันและช่วงเวลาที่หน่วยบริการเปิดรับจองคิว:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pkg.schedules.map((sch) => (
                            <div
                              key={sch.id}
                              className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs space-y-0.5"
                            >
                              <div className="font-semibold text-amber-300">{sch.label}</div>
                              <div className="text-slate-300">
                                เวลา: <strong>{sch.startTime} - {sch.endTime} น.</strong> (รับ {sch.maxQuota} คิว/รอบ)
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {sch.specificDate
                                  ? `วันที่เปิดเฉพาะกิจ: ${sch.specificDate}`
                                  : `วันที่เปิด: ${sch.daysOfWeek.map((d) => DAY_NAMES_SHORT[d]).join(' ')}`}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                สถานที่: {sch.roomName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Pricing Box */}
                      {rightRule && (
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-emerald-300">
                              สิทธิ์ที่เลือก: {rightRule.rightName}
                            </span>
                            <span className="text-xs text-slate-400">
                              ราคาเต็ม {pkg.basePrice.toLocaleString()} บาท
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                              <div className="text-[10px] text-slate-400">ราคาปกติ</div>
                              <div className="text-sm font-bold text-slate-200">
                                {pkg.basePrice.toLocaleString()} ฿
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-emerald-500/30">
                              <div className="text-[10px] text-emerald-300">เบิกตามสิทธิ์ได้</div>
                              <div className="text-sm font-bold text-emerald-400">
                                {rightRule.claimableAmount.toLocaleString()} ฿
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40">
                              <div className="text-[10px] text-amber-200">ชำระจริง (ส่วนเกิน)</div>
                              <div className="text-sm font-bold text-amber-300">
                                {rightRule.copayAmount.toLocaleString()} ฿
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            <strong>เงื่อนไขการใช้สิทธิ์:</strong> {rightRule.privilegeNote}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-300 font-medium">การเตรียมตัว:</span> {pkg.preparation}
                      </div>
                      <button
                        onClick={() => openBookingModal(pkg)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>จองคิวรับบริการ</span>
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
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-emerald-400" />
                    <span>รายการจองคิวรับบริการพิเศษ (Queue & Appointments)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    ตรวจสอบคิวผู้รับบริการแยกตามวันที่ หน่วยบริการ และปรับสถานะการเข้ารับบริการ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="date"
                    value={queueFilterDate}
                    onChange={(e) => setQueueFilterDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <select
                    value={queueFilterUnit}
                    onChange={(e) => setQueueFilterUnit(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="ALL">ทุกหน่วยบริการ</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.shortName}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="ค้นหาเลขคิว / ชื่อ / HN / CID..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white w-56"
                    />
                  </div>
                  <button
                    onClick={() => setQueueFilterDate('')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                  >
                    แสดงทุกวัน
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-3">เลขคิว</th>
                      <th className="py-3 px-3">วันที่ / ช่วงเวลา</th>
                      <th className="py-3 px-3">ผู้รับบริการ (HN / CID)</th>
                      <th className="py-3 px-3">หน่วยบริการ & แพ็กเกจ</th>
                      <th className="py-3 px-3">สิทธิ์การรักษา</th>
                      <th className="py-3 px-3 text-right">เบิกได้ / ชำระจริง</th>
                      <th className="py-3 px-3">สถานะคิว</th>
                      <th className="py-3 px-3 text-right">จัดการสถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          ไม่พบรายการคิวนัดหมายตามเงื่อนไขที่เลือก
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm">
                            {b.queueNumber}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{b.bookingDate}</div>
                            <div className="text-slate-400">{b.timeWindow} น.</div>
                            <div className="text-[11px] text-slate-500">{b.roomName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{b.patientName}</div>
                            <div className="text-slate-400">
                              {b.patientHn ? `HN: ${b.patientHn}` : 'ผู้รับบริการใหม่'} • โทร: {b.patientPhone || '-'}
                            </div>
                            {b.clinicalNote && (
                              <div className="text-[11px] text-amber-300 mt-0.5">
                                หมายเหตุ: {b.clinicalNote}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-emerald-300 font-medium">{b.unitName}</div>
                            <div className="text-slate-300 line-clamp-1">{b.packageTitle}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                RIGHT_BADGES[b.rightCategory]?.colorClass || ''
                              } ${RIGHT_BADGES[b.rightCategory]?.borderClass || ''}`}
                            >
                              {RIGHT_BADGES[b.rightCategory]?.short || b.rightCategory}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {b.pttypeName}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="text-emerald-400">
                              เบิก: {b.claimableAmount.toLocaleString()} ฿
                            </div>
                            <div className="font-bold text-amber-300">
                              ชำระ: {b.netPayAmount.toLocaleString()} ฿
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                b.status === 'CONFIRMED'
                                  ? 'bg-sky-500/20 text-sky-300'
                                  : b.status === 'CHECKED_IN'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : b.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {b.status === 'CONFIRMED'
                                ? 'ยืนยันนัดหมาย'
                                : b.status === 'CHECKED_IN'
                                ? 'กำลังรับบริการ'
                                : b.status === 'COMPLETED'
                                ? 'เสร็จสิ้น/ชำระแล้ว'
                                : 'ยกเลิกคิว'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px]"
                              >
                                รับคิว
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px]"
                              >
                                เสร็จสิ้น
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px]"
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
            {/* Left Column: Create Package for a Service Unit */}
            <div className="lg:col-span-6 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Plus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    1. เพิ่มแพ็กเกจบริการพิเศษใหม่ประจำหน่วยบริการ
                  </h3>
                  <p className="text-xs text-slate-400">
                    หน่วยบริการสามารถเพิ่มแพ็กเกจ กำหนดราคา และค่าธรรมเนียมพิเศษเพื่อจัดหารายได้เสริม
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreatePackage} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">เลือกหน่วยบริการเจ้าของแพ็กเกจ</label>
                  <select
                    value={adminUnitId}
                    onChange={(e) => setAdminUnitId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (HOSxP depcode: {u.hosxpDepcode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">ชื่อแพ็กเกจบริการพิเศษ *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น คลินิกตรวจคัดกรองโรคไต/เบาหวานช่องทางด่วน"
                      value={newPkgTitle}
                      onChange={(e) => setNewPkgTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">รหัสแพ็กเกจ</label>
                    <input
                      type="text"
                      placeholder="เช่น OPD-VIP-03"
                      value={newPkgCode}
                      onChange={(e) => setNewPkgCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">คำอธิบายย่อย / จุดเด่นบริการ</label>
                  <input
                    type="text"
                    placeholder="เช่น ทราบผลแล็บใน 1 ชม. พร้อมพบแพทย์เฉพาะทางโดยไม่ต้องรอคิวห้องตรวจปกติ"
                    value={newPkgSubtitle}
                    onChange={(e) => setNewPkgSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">ราคาแพ็กเกจรวม (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">ค่าธรรมเนียมพิเศษ/ส่วนเกิน (บาท)</label>
                    <input
                      type="number"
                      min={0}
                      value={newPkgFee}
                      onChange={(e) => setNewPkgFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">ระยะเวลาต่อคิว (นาที)</label>
                    <input
                      type="number"
                      min={10}
                      value={newPkgDuration}
                      onChange={(e) => setNewPkgDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    รายการที่รวมในแพ็กเกจ (บรรทัดละ 1 รายการ)
                  </label>
                  <textarea
                    rows={3}
                    value={newPkgInclusions}
                    onChange={(e) => setNewPkgInclusions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">คำแนะนำการเตรียมตัวก่อนรับบริการ</label>
                  <input
                    type="text"
                    value={newPkgPrep}
                    onChange={(e) => setNewPkgPrep(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                >
                  + บันทึกแพ็กเกจบริการพิเศษใหม่
                </button>
              </form>
            </div>

            {/* Right Column: Schedule Slot Configurator for Units */}
            <div className="lg:col-span-6 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Calendar className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    2. กำหนดวันและช่วงเวลาที่หน่วยบริการเปิดรับจองคิว
                  </h3>
                  <p className="text-xs text-slate-400">
                    กำหนดได้ทั้งวันประจำสัปดาห์ (จ.-อา.) หรือเปิดรอบวันที่พิเศษเฉพาะกิจ พร้อมจำนวนคิวรับสูงสุด
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddScheduleSlot} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">เลือกแพ็กเกจที่ต้องการเพิ่มรอบเวลา</label>
                  <select
                    value={schedPkgId}
                    onChange={(e) => setSchedPkgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
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
                    <label className="block text-slate-300 font-medium mb-1">ชื่อรอบบริการ</label>
                    <input
                      type="text"
                      required
                      value={schedLabel}
                      onChange={(e) => setSchedLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      กำหนดวันที่เปิดเฉพาะกิจ (เว้นว่างหากเปิดประจำสัปดาห์)
                    </label>
                    <input
                      type="date"
                      value={schedSpecificDate}
                      onChange={(e) => setSchedSpecificDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    วันในสัปดาห์ที่เปิดให้บริการ (คลิกเลือกวัน)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_NAMES_SHORT.map((dayLabel, idx) => {
                      const active = schedDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => toggleSchedDay(idx)}
                          className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
                            active
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
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
                    <label className="block text-slate-300 font-medium mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      value={schedStart}
                      onChange={(e) => setSchedStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      value={schedEnd}
                      onChange={(e) => setSchedEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">รับสูงสุด (คิว/รอบ)</label>
                    <input
                      type="number"
                      min={1}
                      value={schedQuota}
                      onChange={(e) => setSchedQuota(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">ห้องตรวจ / สถานที่รับบริการ</label>
                    <input
                      type="text"
                      value={schedRoom}
                      onChange={(e) => setSchedRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">แพทย์ / เจ้าหน้าที่ผู้ให้บริการ</label>
                    <input
                      type="text"
                      value={schedProvider}
                      onChange={(e) => setSchedProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition"
                >
                  + เพิ่มรอบวัน-เวลาเปิดรับบริการ
                </button>
              </form>

              {/* Existing Schedules for Selected Package */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  รอบเวลาที่เปิดอยู่ของแพ็กเกจนี้:
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {packages
                    .find((p) => p.id === schedPkgId)
                    ?.schedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-amber-300">{s.label}</div>
                          <div className="text-slate-400">
                            {s.specificDate
                              ? `วันที่เฉพาะกิจ: ${s.specificDate}`
                              : s.daysOfWeek.map((d) => DAY_NAMES_SHORT[d]).join(' ')}{' '}
                            • {s.startTime}-{s.endTime} น. • โควตา {s.maxQuota} คิว ({s.roomName})
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteScheduleSlot(schedPkgId, s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="ลบรอบเวลานี้"
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

        {/* TAB 4: REVENUE ANALYTICS & THAID / HOSXP CONNECTION */}
        {activeTab === 'revenue' && (
          <section className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">คิวจองบริการพิเศษทั้งหมด</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {analytics?.activeBookingsCount || 0} คิว
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">นับเฉพาะคิวที่ยืนยันและรับบริการ</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">มูลค่าบริการรวม (Gross Revenue)</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {(analytics?.totalGrossRevenue || 0).toLocaleString()} ฿
                </div>
                <div className="text-[11px] text-slate-400 mt-1">รวมมูลค่าแพ็กเกจทุกหน่วยบริการ</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30">
                <div className="text-xs text-emerald-300">ยอดเบิกชดเชยตามสิทธิ์ (OFC/LGO/UCS/SSS)</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {(analytics?.totalClaimable || 0).toLocaleString()} ฿
                </div>
                <div className="text-[11px] text-slate-400 mt-1">เบิกจากกองทุนสิทธิ์การรักษา</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30">
                <div className="text-xs text-amber-300">รายได้เงินบำรุงรับสุทธิ (Co-pay / บริการพิเศษ)</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">
                  {(analytics?.totalNetPatientPay || 0).toLocaleString()} ฿
                </div>
                <div className="text-[11px] text-slate-400 mt-1">ชำระส่วนเกินคลินิกพิเศษ/ชำระเอง</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Service Unit */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span>สรุปรายได้แยกตามหน่วยบริการ (Service Units)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">หน่วยบริการ</th>
                        <th className="py-2 text-center">จำนวนคิว</th>
                        <th className="py-2 text-right">เบิกตามสิทธิ์</th>
                        <th className="py-2 text-right">ชำระส่วนเกิน</th>
                        <th className="py-2 text-right">รวมรายได้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(analytics?.revenueByUnit || []).map((row: any) => (
                        <tr key={row.unitId}>
                          <td className="py-2.5 font-medium text-white">{row.unitName}</td>
                          <td className="py-2.5 text-center">{row.bookingCount}</td>
                          <td className="py-2.5 text-right text-emerald-400">
                            {row.claimableRevenue.toLocaleString()} ฿
                          </td>
                          <td className="py-2.5 text-right text-amber-300">
                            {row.copayRevenue.toLocaleString()} ฿
                          </td>
                          <td className="py-2.5 text-right font-bold text-white">
                            {row.grossRevenue.toLocaleString()} ฿
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ThaID & HOSxP Configuration Info */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  <span>สถานะการเชื่อมต่อระบบ ThaID (DOPA) & HOSxP Database</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Callback Endpoint (ThaID):</span>
                    <code className="text-emerald-300 font-mono">
                      {health?.thaid?.callbackUrl || 'http://147.50.107.211:3601/'}
                    </code>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">ThaID OAuth2 Authorize Endpoint:</span>
                    <code className="text-slate-300 font-mono truncate max-w-[260px]">
                      {health?.thaid?.authUrl || 'https://imauth.bora.dopa.go.th/api/v2/oauth2/auth/'}
                    </code>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">ThaID Client ID:</span>
                    <code className="text-indigo-300 font-mono">
                      {health?.thaid?.clientIdPreview || 'MFloMmR5NG...'} (Configured)
                    </code>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">ฐานข้อมูล HOSxP (Read-Only):</span>
                    <span className={health?.hosxp?.ok ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                      {health?.hosxp?.host || '192.168.2.254'} — {health?.hosxp?.message}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: THAID LOGIN & HOSXP RIGHT VERIFICATION */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    ยืนยันตัวตนด้วย ThaID & ตรวจสอบสิทธิ์การรักษา
                  </h3>
                  <p className="text-xs text-slate-400">
                    เชื่อมต่อระบบพิสูจน์ตัวตนกรมการปกครอง (DOPA) และฐานข้อมูล HOSxP รพ.โคกศรีสุพรรณ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authStatusMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs border ${
                  authStatusMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : authStatusMsg.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                }`}
              >
                {authStatusMsg.text}
              </div>
            )}

            {/* Option A: Official ThaID OAuth2 Redirect */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">
                  วิธีที่ 1: เข้าสู่ระบบผ่านแอปพลิเคชัน ThaID (OAuth 2.0)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  Callback: 147.50.107.211:3601
                </span>
              </div>
              <p className="text-xs text-slate-300">
                สแกน QR Code หรือยืนยันตัวตนผ่านแอป ThaID ของกรมการปกครองเพื่อดึงชื่อ-สกุลและสิทธิ์อัตโนมัติ
              </p>
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">Scope ข้อมูลที่ร้องขอจาก ThaID:</label>
                <select
                  value={thaidScopeOption}
                  onChange={(e) => setThaidScopeOption(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="openid pid given_name middle_name family_name">
                    มาตรฐาน: openid pid given_name middle_name family_name
                  </option>
                  <option value="openid given_name middle_name">
                    เฉพาะชื่อ-ชื่อกลาง: openid given_name middle_name (ตามที่ติ๊กในหน้าตั้งค่า)
                  </option>
                  <option value="openid pid title given_name family_name gender birthdate">
                    ข้อมูลครบชุด: openid pid title given_name family_name gender birthdate
                  </option>
                  <option value="openid">เฉพาะรหัสยืนยันตัวตน: openid</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleStartThaIDRedirect}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วยแอป ThaID ทันที</span>
              </button>
            </div>

            {/* Option B: Direct CID / HN Verification with HOSxP */}
            <form onSubmit={handleVerifyCidWithHosxp} className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="font-bold text-emerald-300">
                วิธีที่ 2: ตรวจสอบสิทธิ์การรักษาจากฐานข้อมูล HOSxP ด้วยเลขบัตรประชาชน 13 หลัก หรือ HN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">เลขประจำตัวประชาชน 13 หลัก หรือ HN *</label>
                  <input
                    type="text"
                    required
                    placeholder="กรอกเลขบัตรประชาชน 13 หลัก หรือ HN 7 หลัก"
                    value={verifyCidInput}
                    onChange={(e) => setVerifyCidInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ชื่อ-นามสกุล (กรณีผู้ป่วยใหม่นอก รพ.)</label>
                  <input
                    type="text"
                    placeholder="ระบบดึงจาก HOSxP อัตโนมัติถ้ามีประวัติ"
                    value={verifyNameInput}
                    onChange={(e) => setVerifyNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="08x-xxx-xxxx"
                    value={verifyPhoneInput}
                    onChange={(e) => setVerifyPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
              >
                ตรวจสอบสิทธิ์จาก HOSxP & เข้าใช้งาน
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PACKAGE QUEUE BOOKING & DIGITAL SLIP */}
      {bookingPkg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400">
                  จองคิวรับบริการพิเศษ • #{bookingPkg.code}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">{bookingPkg.title}</h3>
              </div>
              <button
                onClick={() => setBookingPkg(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdSlip ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-950 border-2 border-emerald-500/60 space-y-3 text-center">
                  <BadgeCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    จองคิวรับบริการพิเศษสำเร็จ (Digital Queue Slip)
                  </div>
                  <div className="text-4xl font-extrabold font-mono text-white tracking-wider">
                    คิวที่ {createdSlip.queueNumber}
                  </div>
                  <div className="text-sm font-semibold text-emerald-200">{createdSlip.packageTitle}</div>

                  <div className="grid grid-cols-2 gap-3 text-left text-xs bg-slate-900/90 p-4 rounded-xl border border-slate-800 mt-2">
                    <div>
                      <span className="text-slate-400">ผู้รับบริการ:</span>
                      <div className="font-bold text-white">{createdSlip.patientName}</div>
                      {createdSlip.patientHn && (
                        <div className="text-emerald-300">HN: {createdSlip.patientHn}</div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400">วันที่ & ช่วงเวลานัด:</span>
                      <div className="font-bold text-amber-300">
                        {createdSlip.bookingDate} ({createdSlip.timeWindow} น.)
                      </div>
                      <div className="text-slate-300">{createdSlip.roomName}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">สิทธิ์การรักษา:</span>
                      <div className="font-semibold text-white">{createdSlip.pttypeName}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">สรุปค่าใช้จ่าย:</span>
                      <div className="text-emerald-400">
                        เบิกตามสิทธิ์: {createdSlip.claimableAmount.toLocaleString()} บาท
                      </div>
                      <div className="font-bold text-amber-300">
                        ชำระส่วนเกิน: {createdSlip.netPayAmount.toLocaleString()} บาท
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 pt-1">
                    กรุณานำบัตรประชาชน หรือแสดงหน้าจอนี้พร้อมแอป ThaID ที่ <strong>{createdSlip.roomName}</strong> ก่อนเวลานัด 10 นาที
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setBookingPkg(null);
                      setActiveTab('queues');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    ดูตารางคิวทั้งหมด
                  </button>
                  <button
                    onClick={() => setBookingPkg(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
                {/* Step 1: Date & Schedule Slot Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1. เลือกวันที่ต้องการรับบริการ *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      2. เลือกช่วงเวลาที่เปิดรับบริการ *
                    </label>
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      {availableSlots.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.label} ({s.startTime}-{s.endTime} น.) — ว่าง {s.remainingQuota}/{s.maxQuota} คิว
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 2: Patient Info & HOSxP Auto-Fill */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-300">
                      3. ข้อมูลผู้รับบริการ & สิทธิ์การรักษา (ดึงจาก ThaID / HOSxP)
                    </span>
                    <button
                      type="button"
                      onClick={handleLookupInBookingModal}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px]"
                    >
                      ค้นหาสิทธิ์จาก HOSxP
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-slate-400 mb-1">เลขบัตรประชาชน 13 หลัก</label>
                      <input
                        type="text"
                        placeholder="ระบุเลข 13 หลัก"
                        value={bookingCid}
                        onChange={(e) => setBookingCid(e.target.value)}
                        onBlur={handleLookupInBookingModal}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">HN โรงพยาบาล (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="เช่น 0012458"
                        value={bookingHn}
                        onChange={(e) => setBookingHn(e.target.value)}
                        onBlur={handleLookupInBookingModal}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                      <input
                        type="text"
                        required
                        placeholder="08x-xxx-xxxx"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-400 mb-1">ชื่อ - นามสกุล ผู้รับบริการ *</label>
                      <input
                        type="text"
                        required
                        placeholder="นาย/นาง/น.ส. ชื่อ นามสกุล"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">สิทธิ์การรักษาที่ใช้จองคิว *</label>
                      <select
                        value={bookingRight}
                        onChange={(e) => setBookingRight(e.target.value as RightCategory)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      >
                        {(['OFC', 'LGO', 'UCS', 'SSS', 'CASH'] as RightCategory[]).map((rc) => (
                          <option key={rc} value={rc}>
                            {RIGHT_BADGES[rc].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      อาการเบื้องต้น / ความต้องการเพิ่มเติมแจ้งหน่วยบริการ
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ขอตรวจคลื่นหัวใจเพิ่ม, ปวดสะบักขวาเรื้อรัง, ต้องการใบรับรองแพทย์"
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Price Calculation Preview */}
                {(() => {
                  const rule =
                    bookingPkg.rightsPricing.find((r) => r.rightCategory === bookingRight) ||
                    bookingPkg.rightsPricing[0];
                  return (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-slate-300 font-semibold">{rule?.rightName}</div>
                        <div className="text-[11px] text-slate-400">{rule?.privilegeNote}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-400">
                          เบิกได้ตามสิทธิ์: {(rule?.claimableAmount || 0).toLocaleString()} บาท
                        </div>
                        <div className="text-base font-bold text-amber-300">
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
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg transition"
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
