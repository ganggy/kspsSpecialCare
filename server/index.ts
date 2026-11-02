import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  classifyRightCategory,
  getHosxpActivePttypes,
  getHosxpDepartments,
  lookupPatientByCidOrHn,
  RightCategory,
  testHosxpConnection,
} from './hosxp.js';
import {
  buildThaIDAuthUrl,
  createDirectPatientSession,
  exchangeThaIDCode,
  getSessionUser,
  getThaIDConfig,
} from './thaid.js';
import {
  BookingStatus,
  loadStore,
  PackageScheduleSlot,
  saveStore,
  ServiceUnit,
  SpecialBooking,
  SpecialPackage,
} from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT || 3601);
const STAFF_PIN = process.env.STAFF_PIN || '10979';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 1. Health & System Status
app.get('/api/health', async (_req, res) => {
  const hosxp = await testHosxpConnection();
  const thaid = getThaIDConfig();
  const store = loadStore();

  res.json({
    status: 'ok',
    service: 'KSPS Special Care & Revenue Platform',
    hospital: 'โรงพยาบาลโคกศรีสุพรรณ (10979)',
    port: PORT,
    timestamp: new Date().toISOString(),
    hosxp,
    thaid: {
      configured: Boolean(thaid.clientId && thaid.clientSecret),
      callbackUrl: thaid.callbackUrl,
      clientIdPreview: thaid.clientId ? `${thaid.clientId.slice(0, 10)}...` : '',
      authUrl: thaid.authUrl,
      defaultScope: thaid.defaultScope,
    },
    counts: {
      units: store.units.length,
      packages: store.packages.length,
      bookings: store.bookings.length,
    },
  });
});

// 2. ThaID OAuth2 Endpoints
app.get('/api/auth/thaid/url', (req, res) => {
  const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
  const redirectUri = typeof req.query.redirectUri === 'string' ? req.query.redirectUri : undefined;
  const authData = buildThaIDAuthUrl(scope, redirectUri);
  res.json({
    ok: true,
    ...authData,
  });
});

app.post('/api/auth/thaid/exchange', async (req, res) => {
  const { code, state, redirectUri } = req.body || {};
  if (!code) {
    return res.status(400).json({ ok: false, error: 'ไม่พบรหัส Authorization Code จากระบบ ThaID' });
  }
  try {
    const sessionUser = await exchangeThaIDCode(String(code), state ? String(state) : undefined, redirectUri);
    return res.json({
      ok: true,
      user: sessionUser,
    });
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: err?.message || 'การยืนยันตัวตนผ่าน ThaID ไม่สำเร็จ',
    });
  }
});

// ยืนยันตัวตนด้วยเลขบัตรประชาชน 13 หลัก หรือ HN เพื่อตรวจสอบสิทธิจาก HOSxP
app.post('/api/auth/patient/verify', async (req, res) => {
  const { cidOrHn, fullName, phone } = req.body || {};
  if (!cidOrHn || String(cidOrHn).trim().length < 4) {
    return res.status(400).json({ ok: false, error: 'กรุณาระบุเลขประจำตัวประชาชน 13 หลัก หรือ HN' });
  }
  try {
    const sessionUser = await createDirectPatientSession(String(cidOrHn), fullName, phone);
    return res.json({
      ok: true,
      user: sessionUser,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'ไม่สามารถตรวจสอบข้อมูลผู้รับบริการได้',
    });
  }
});

app.get('/api/auth/session/:sessionId', (req, res) => {
  const user = getSessionUser(req.params.sessionId);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'ไม่พบเซสชันผู้ใช้งาน หรือเซสชันหมดอายุ' });
  }
  return res.json({ ok: true, user });
});

app.post('/api/auth/staff/verify', (req, res) => {
  const { pin } = req.body || {};
  if (String(pin || '').trim() === STAFF_PIN) {
    return res.json({ ok: true, role: 'STAFF_ADMIN' });
  }
  return res.status(401).json({ ok: false, error: 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง' });
});

// 3. HOSxP Read-Only Lookup
app.get('/api/hosxp/patient', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (!q.trim()) {
    return res.status(400).json({ ok: false, error: 'กรุณาระบุเลขบัตรประชาชน 13 หลัก หรือ HN' });
  }
  const profile = await lookupPatientByCidOrHn(q);
  return res.json({
    ok: true,
    found: Boolean(profile),
    profile,
  });
});

app.get('/api/hosxp/metadata', async (_req, res) => {
  const [departments, pttypes] = await Promise.all([
    getHosxpDepartments(),
    getHosxpActivePttypes(),
  ]);
  res.json({
    ok: true,
    departments,
    pttypes,
  });
});

// 4. Catalog & Revenue Analytics
app.get('/api/catalog', (_req, res) => {
  const store = loadStore();

  const activeBookings = store.bookings.filter((b) => b.status !== 'CANCELLED');
  const totalGrossRevenue = activeBookings.reduce((sum, b) => sum + Number(b.basePrice || 0), 0);
  const totalClaimable = activeBookings.reduce((sum, b) => sum + Number(b.claimableAmount || 0), 0);
  const totalNetPatientPay = activeBookings.reduce((sum, b) => sum + Number(b.netPayAmount || 0), 0);

  const revenueByUnit = store.units.map((u) => {
    const unitBookings = activeBookings.filter((b) => b.unitId === u.id);
    return {
      unitId: u.id,
      unitName: u.shortName,
      bookingCount: unitBookings.length,
      grossRevenue: unitBookings.reduce((s, b) => s + Number(b.basePrice || 0), 0),
      claimableRevenue: unitBookings.reduce((s, b) => s + Number(b.claimableAmount || 0), 0),
      copayRevenue: unitBookings.reduce((s, b) => s + Number(b.netPayAmount || 0), 0),
    };
  });

  const rightsList: RightCategory[] = ['OFC', 'LGO', 'UCS', 'SSS', 'CASH'];
  const revenueByRight = rightsList.map((rc) => {
    const rBookings = activeBookings.filter((b) => b.rightCategory === rc);
    return {
      rightCategory: rc,
      bookingCount: rBookings.length,
      grossRevenue: rBookings.reduce((s, b) => s + Number(b.basePrice || 0), 0),
      claimableRevenue: rBookings.reduce((s, b) => s + Number(b.claimableAmount || 0), 0),
      copayRevenue: rBookings.reduce((s, b) => s + Number(b.netPayAmount || 0), 0),
    };
  });

  res.json({
    ok: true,
    units: store.units,
    packages: store.packages,
    bookings: store.bookings,
    analytics: {
      totalBookings: store.bookings.length,
      activeBookingsCount: activeBookings.length,
      totalGrossRevenue,
      totalClaimable,
      totalNetPatientPay,
      revenueByUnit,
      revenueByRight,
    },
  });
});

// 5. Slot Availability Check for a Package & Date
app.get('/api/availability', (req, res) => {
  const packageId = String(req.query.packageId || '');
  const dateStr = String(req.query.date || new Date().toISOString().slice(0, 10));

  const store = loadStore();
  const pkg = store.packages.find((p) => p.id === packageId);
  if (!pkg) {
    return res.status(404).json({ ok: false, error: 'ไม่พบแพ็กเกจบริการที่ระบุ' });
  }

  const parsedDate = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = isNaN(parsedDate.getTime()) ? new Date().getDay() : parsedDate.getDay();

  const slots = pkg.schedules
    .filter((s) => s.isActive)
    .map((sched) => {
      const matchesSpecificDate = sched.specificDate && sched.specificDate === dateStr;
      const matchesDayOfWeek =
        (!sched.specificDate || sched.specificDate === '') && sched.daysOfWeek.includes(dayOfWeek);
      const isOpenToday = Boolean(matchesSpecificDate || matchesDayOfWeek);

      const bookedCount = store.bookings.filter(
        (b) =>
          b.packageId === pkg.id &&
          b.scheduleId === sched.id &&
          b.bookingDate === dateStr &&
          b.status !== 'CANCELLED'
      ).length;

      const remainingQuota = Math.max(0, sched.maxQuota - bookedCount);

      return {
        ...sched,
        date: dateStr,
        dayOfWeek,
        isOpenToday,
        bookedCount,
        remainingQuota,
        isAvailable: isOpenToday && remainingQuota > 0,
      };
    });

  return res.json({
    ok: true,
    packageId: pkg.id,
    date: dateStr,
    dayOfWeek,
    slots,
  });
});

// 6. Create or Update Service Unit
app.post('/api/units', (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.code) {
    return res.status(400).json({ ok: false, error: 'กรุณาระบุรหัสและชื่อหน่วยบริการ' });
  }

  const store = loadStore();
  const existingIdx = store.units.findIndex((u) => u.id === body.id);

  const unitItem: ServiceUnit = {
    id: body.id || `UNIT-${String(body.code).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    code: String(body.code).toUpperCase().trim(),
    hosxpDepcode: String(body.hosxpDepcode || '001'),
    name: String(body.name).trim(),
    shortName: String(body.shortName || body.name).trim(),
    description: String(body.description || ''),
    location: String(body.location || 'โรงพยาบาลโคกศรีสุพรรณ'),
    contactPhone: String(body.contactPhone || '042-766054'),
    iconName: String(body.iconName || 'Stethoscope'),
    themeColor: String(body.themeColor || 'emerald'),
    isActive: body.isActive !== false,
  };

  if (existingIdx >= 0) {
    store.units[existingIdx] = unitItem;
  } else {
    store.units.push(unitItem);
  }

  saveStore(store);
  return res.json({ ok: true, unit: unitItem });
});

// 7. Create or Update Special Package
app.post('/api/packages', (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.unitId) {
    return res.status(400).json({ ok: false, error: 'กรุณาระบุชื่อแพ็กเกจและหน่วยบริการ' });
  }

  const store = loadStore();
  const unit = store.units.find((u) => u.id === body.unitId);
  const existingIdx = store.packages.findIndex((p) => p.id === body.id);

  const basePrice = Number(body.basePrice || 500);
  const specialClinicFee = Number(body.specialClinicFee || 150);

  const defaultRightsPricing = [
    {
      rightCategory: 'OFC' as RightCategory,
      rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
      isEligible: true,
      claimableAmount: Math.max(0, basePrice - specialClinicFee),
      copayAmount: specialClinicFee,
      privilegeNote: 'เบิกได้ตามเกณฑ์กรมบัญชีกลาง ชำระส่วนเกินค่าบริการคลินิกพิเศษ',
    },
    {
      rightCategory: 'LGO' as RightCategory,
      rightName: 'สิทธิ อปท. (LGO)',
      isEligible: true,
      claimableAmount: Math.max(0, basePrice - specialClinicFee),
      copayAmount: specialClinicFee,
      privilegeNote: 'เบิกจ่ายตรงสิทธิ อปท. ชำระส่วนเกินค่าบริการคลินิกพิเศษ',
    },
    {
      rightCategory: 'UCS' as RightCategory,
      rightName: 'สิทธิบัตรทอง 30 บาท (UCS)',
      isEligible: true,
      claimableAmount: Math.round(basePrice * 0.4),
      copayAmount: basePrice - Math.round(basePrice * 0.4),
      privilegeNote: 'ใช้สิทธิพื้นฐานร่วมได้ ชำระเฉพาะส่วนบริการเสริมพิเศษ',
    },
    {
      rightCategory: 'SSS' as RightCategory,
      rightName: 'สิทธิประกันสังคม (SSS)',
      isEligible: true,
      claimableAmount: Math.round(basePrice * 0.5),
      copayAmount: basePrice - Math.round(basePrice * 0.5),
      privilegeNote: 'ใช้สิทธิประกันสังคมร่วมได้ตามเงื่อนไข ชำระส่วนเกิน',
    },
    {
      rightCategory: 'CASH' as RightCategory,
      rightName: 'ชำระเงินเอง (Self-Pay)',
      isEligible: true,
      claimableAmount: 0,
      copayAmount: basePrice,
      privilegeNote: 'อัตราค่าบริการเหมาจ่ายพิเศษของโรงพยาบาล',
    },
  ];

  const pkgItem: SpecialPackage = {
    id: body.id || `PKG-${Date.now().toString().slice(-6)}`,
    code: String(body.code || `PKG-${Date.now().toString().slice(-4)}`).toUpperCase(),
    unitId: String(body.unitId),
    hosxpDepcode: String(body.hosxpDepcode || unit?.hosxpDepcode || '001'),
    title: String(body.title).trim(),
    subtitle: String(body.subtitle || '').trim(),
    description: String(body.description || '').trim(),
    durationMinutes: Number(body.durationMinutes || 45),
    basePrice,
    specialClinicFee,
    inclusions: Array.isArray(body.inclusions)
      ? body.inclusions.filter(Boolean)
      : String(body.inclusions || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
    preparation: String(body.preparation || 'นำบัตรประชาชน หรือเปิดแอป ThaID มายืนยันตัวตนก่อนเวลานัด 10 นาที'),
    rightsPricing: Array.isArray(body.rightsPricing) && body.rightsPricing.length > 0
      ? body.rightsPricing
      : existingIdx >= 0
      ? store.packages[existingIdx].rightsPricing
      : defaultRightsPricing,
    schedules: Array.isArray(body.schedules) && body.schedules.length > 0
      ? body.schedules
      : existingIdx >= 0
      ? store.packages[existingIdx].schedules
      : [
          {
            id: `SCH-${Date.now().toString().slice(-5)}`,
            label: 'คลินิกนอกเวลา (จันทร์ - ศุกร์)',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '16:30',
            endTime: '19:30',
            maxQuota: 10,
            roomName: unit?.location || 'จุดบริการคลินิกพิเศษ',
            providerName: 'ทีมบุคลากรทางการแพทย์',
            isActive: true,
          },
        ],
    isActive: body.isActive !== false,
    createdAt: existingIdx >= 0 ? store.packages[existingIdx].createdAt : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    store.packages[existingIdx] = pkgItem;
  } else {
    store.packages.push(pkgItem);
  }

  saveStore(store);
  return res.json({ ok: true, package: pkgItem });
});

// 8. Add or Update Schedule Slot on a Package
app.post('/api/packages/:id/schedules', (req, res) => {
  const pkgId = req.params.id;
  const body = req.body || {};

  const store = loadStore();
  const pkg = store.packages.find((p) => p.id === pkgId);
  if (!pkg) {
    return res.status(404).json({ ok: false, error: 'ไม่พบแพ็กเกจบริการ' });
  }

  const slot: PackageScheduleSlot = {
    id: body.id || `SCH-${Date.now().toString().slice(-6)}`,
    label: String(body.label || 'รอบบริการพิเศษ').trim(),
    daysOfWeek: Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map(Number) : [1, 2, 3, 4, 5],
    specificDate: body.specificDate ? String(body.specificDate) : null,
    startTime: String(body.startTime || '16:30'),
    endTime: String(body.endTime || '19:30'),
    maxQuota: Math.max(1, Number(body.maxQuota || 10)),
    roomName: String(body.roomName || 'ห้องตรวจพิเศษ'),
    providerName: String(body.providerName || 'แพทย์/เจ้าหน้าที่เวรคลินิกพิเศษ'),
    isActive: body.isActive !== false,
  };

  const existingIdx = pkg.schedules.findIndex((s) => s.id === slot.id);
  if (existingIdx >= 0) {
    pkg.schedules[existingIdx] = slot;
  } else {
    pkg.schedules.push(slot);
  }

  saveStore(store);
  return res.json({ ok: true, package: pkg, schedule: slot });
});

app.delete('/api/packages/:id/schedules/:scheduleId', (req, res) => {
  const store = loadStore();
  const pkg = store.packages.find((p) => p.id === req.params.id);
  if (!pkg) {
    return res.status(404).json({ ok: false, error: 'ไม่พบแพ็กเกจบริการ' });
  }
  pkg.schedules = pkg.schedules.filter((s) => s.id !== req.params.scheduleId);
  saveStore(store);
  return res.json({ ok: true, package: pkg });
});

// 9. Create Booking (Online Patient or Staff Desk)
app.post('/api/bookings', async (req, res) => {
  const body = req.body || {};
  const {
    packageId,
    scheduleId,
    bookingDate,
    patientCid,
    patientHn,
    patientName,
    patientPhone,
    rightCategory,
    pttypeCode,
    pttypeName,
    bookingChannel,
    clinicalNote,
  } = body;

  if (!packageId || !scheduleId || !bookingDate || !patientName) {
    return res.status(400).json({
      ok: false,
      error: 'กรุณาระบุแพ็กเกจ ช่วงเวลา วันที่รับบริการ และชื่อผู้รับบริการให้ครบถ้วน',
    });
  }

  const store = loadStore();
  const pkg = store.packages.find((p) => p.id === packageId);
  if (!pkg) {
    return res.status(404).json({ ok: false, error: 'ไม่พบแพ็กเกจที่เลือก' });
  }

  const unit = store.units.find((u) => u.id === pkg.unitId);
  const sched = pkg.schedules.find((s) => s.id === scheduleId);
  if (!sched) {
    return res.status(404).json({ ok: false, error: 'ไม่พบรอบเวลาบริการที่เลือก' });
  }

  const activeBookingsInSlot = store.bookings.filter(
    (b) =>
      b.packageId === pkg.id &&
      b.scheduleId === sched.id &&
      b.bookingDate === bookingDate &&
      b.status !== 'CANCELLED'
  );

  if (activeBookingsInSlot.length >= sched.maxQuota && bookingChannel !== 'STAFF_DESK') {
    return res.status(400).json({
      ok: false,
      error: `คิวรอบเวลา ${sched.startTime}-${sched.endTime} ของวันที่ ${bookingDate} เต็มแล้ว (${sched.maxQuota} คิว)`,
    });
  }

  // Enrich from HOSxP if CID or HN provided
  let resolvedHn = patientHn || null;
  let resolvedRightCat: RightCategory = (rightCategory as RightCategory) || 'UCS';
  let resolvedPttypeCode = pttypeCode || '';
  let resolvedPttypeName = pttypeName || '';

  if (patientCid || patientHn) {
    const hosxpProfile = await lookupPatientByCidOrHn(String(patientCid || patientHn));
    if (hosxpProfile) {
      resolvedHn = resolvedHn || hosxpProfile.hn;
      if (!rightCategory) {
        resolvedRightCat = hosxpProfile.rightCategory;
      }
      resolvedPttypeCode = resolvedPttypeCode || hosxpProfile.pttypeCode;
      resolvedPttypeName = resolvedPttypeName || hosxpProfile.pttypeName;
    }
  }

  if (!resolvedPttypeName) {
    const classified = classifyRightCategory(resolvedPttypeCode, '', resolvedRightCat);
    resolvedPttypeName = classified.label;
  }

  const rightRule =
    pkg.rightsPricing.find((r) => r.rightCategory === resolvedRightCat) ||
    pkg.rightsPricing.find((r) => r.rightCategory === 'CASH');

  const claimableAmount = rightRule ? Number(rightRule.claimableAmount) : 0;
  const netPayAmount = rightRule ? Number(rightRule.copayAmount) : pkg.basePrice;

  const unitPrefix = unit?.code || 'SPC';
  const unitBookingsOnDate = store.bookings.filter(
    (b) => b.unitId === pkg.unitId && b.bookingDate === bookingDate
  ).length;
  const queueNumber = `${unitPrefix}-${String(unitBookingsOnDate + 1).padStart(3, '0')}`;

  const newBooking: SpecialBooking = {
    id: `BKG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    queueNumber,
    packageId: pkg.id,
    packageTitle: pkg.title,
    unitId: pkg.unitId,
    unitName: unit?.name || pkg.unitId,
    scheduleId: sched.id,
    scheduleLabel: sched.label,
    bookingDate: String(bookingDate),
    timeWindow: `${sched.startTime} - ${sched.endTime}`,
    roomName: sched.roomName,
    patientCid: String(patientCid || '').trim(),
    patientHn: resolvedHn,
    patientName: String(patientName).trim(),
    patientPhone: String(patientPhone || '').trim(),
    rightCategory: resolvedRightCat,
    pttypeCode: resolvedPttypeCode || '10',
    pttypeName: resolvedPttypeName,
    basePrice: pkg.basePrice,
    claimableAmount,
    netPayAmount,
    status: 'CONFIRMED',
    bookingChannel: bookingChannel || 'WEB_SELF',
    clinicalNote: String(clinicalNote || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.bookings.unshift(newBooking);
  saveStore(store);

  return res.json({
    ok: true,
    booking: newBooking,
  });
});

// 10. Update Booking Status / Details (Staff or Patient Cancel)
app.patch('/api/bookings/:id/status', (req, res) => {
  const { status, clinicalNote, rightCategory } = req.body || {};
  const store = loadStore();
  const booking = store.bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ ok: false, error: 'ไม่พบรายการจองคิว' });
  }

  if (status) {
    booking.status = status as BookingStatus;
  }
  if (typeof clinicalNote === 'string') {
    booking.clinicalNote = clinicalNote;
  }
  if (rightCategory) {
    booking.rightCategory = rightCategory as RightCategory;
    const pkg = store.packages.find((p) => p.id === booking.packageId);
    const rule = pkg?.rightsPricing.find((r) => r.rightCategory === rightCategory);
    if (rule) {
      booking.claimableAmount = rule.claimableAmount;
      booking.netPayAmount = rule.copayAmount;
      booking.pttypeName = rule.rightName;
    }
  }
  booking.updatedAt = new Date().toISOString();

  saveStore(store);
  return res.json({ ok: true, booking });
});

// Serve Static Frontend SPA in Production
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('KSPS Special Care & Revenue Platform is READY!');
  console.log(`Local / LAN URL : http://192.168.2.202:${PORT}`);
  console.log(`Public / ThaID  : http://147.50.107.211:${PORT}/`);
  console.log('====================================================');
});
