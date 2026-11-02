import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RightCategory } from './hosxp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export interface ServiceUnit {
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

export interface RightPricingRule {
  rightCategory: RightCategory;
  rightName: string;
  isEligible: boolean;
  claimableAmount: number;
  copayAmount: number;
  privilegeNote: string;
}

export interface PackageScheduleSlot {
  id: string;
  label: string;
  daysOfWeek: number[]; // 0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์
  specificDate?: string | null; // YYYY-MM-DD (หากหน่วยบริการกำหนดเปิดวันพิเศษเฉพาะกิจ)
  startTime: string; // e.g. "16:30"
  endTime: string; // e.g. "20:00"
  maxQuota: number;
  roomName: string;
  providerName: string;
  isActive: boolean;
}

export interface SpecialPackage {
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
  createdAt: string;
}

export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface SpecialBooking {
  id: string;
  queueNumber: string;
  packageId: string;
  packageTitle: string;
  unitId: string;
  unitName: string;
  scheduleId: string;
  scheduleLabel: string;
  bookingDate: string; // YYYY-MM-DD
  timeWindow: string; // "16:30 - 20:00"
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
  status: BookingStatus;
  bookingChannel: 'THAID_ONLINE' | 'WEB_SELF' | 'STAFF_DESK';
  clinicalNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSchema {
  units: ServiceUnit[];
  packages: SpecialPackage[];
  bookings: SpecialBooking[];
}

function getInitialSeed(): StoreSchema {
  const units: ServiceUnit[] = [
    {
      id: 'UNIT-OPD',
      code: 'OPD',
      hosxpDepcode: '001',
      name: 'คลินิกพิเศษผู้ป่วยนอก (OPD VIP & คลินิกนอกเวลา)',
      shortName: 'OPD คลินิกพิเศษ',
      description: 'บริการตรวจรักษาคลินิกพิเศษนอกเวลาราชการ ตรวจสุขภาพประจำปีข้าราชการ และบริการ Fast Track ลดเวลารอคอย',
      location: 'อาคารผู้ป่วยนอก ชั้น 1 (จุดบริการพิเศษ โต๊ะ 1)',
      contactPhone: '042-766054 ต่อ 101',
      iconName: 'Stethoscope',
      themeColor: 'emerald',
      isActive: true,
    },
    {
      id: 'UNIT-TTM',
      code: 'TTM',
      hosxpDepcode: '025',
      name: 'ศูนย์การแพทย์แผนไทยและการแพทย์ทางเลือกพิเศษ',
      shortName: 'แพทย์แผนไทย & สปา',
      description: 'บริการนวดรักษาเฉพาะจุด ประคบสมุนไพรสด อบไอน้ำสมุนไพร สปาฟื้นฟูมารดาหลังคลอด และฝังเข็มคลินิกพิเศษ',
      location: 'อาคารแพทย์แผนไทย (คลินิกบริการพิเศษ)',
      contactPhone: '042-766054 ต่อ 225',
      iconName: 'Sparkles',
      themeColor: 'amber',
      isActive: true,
    },
    {
      id: 'UNIT-DENT',
      code: 'DENT',
      hosxpDepcode: '005',
      name: 'คลินิกทันตกรรมพิเศษนอกเวลา (Dental Special Care)',
      shortName: 'ทันตกรรมพิเศษ',
      description: 'ขูดหินปูน ขัดฟัน อุดฟัน ผ่าฟันคุด และทันตกรรมเพื่อความสวยงาม โดยไม่ต้องรอคิวในเวลาราชการ',
      location: 'ฝ่ายทันตสาธารณสุข อาคารผู้ป่วยนอก',
      contactPhone: '042-766054 ต่อ 105',
      iconName: 'Smile',
      themeColor: 'cyan',
      isActive: true,
    },
    {
      id: 'UNIT-PT',
      code: 'PT',
      hosxpDepcode: '012',
      name: 'คลินิกกายภาพบำบัดพิเศษ (Physical Therapy Plus)',
      shortName: 'กายภาพบำบัดพิเศษ',
      description: 'โปรแกรมรักษาออฟฟิศซินโดรมด้วยเลเซอร์กำลังสูง อัลตราซาวด์ และการฟื้นฟูสมรรถภาพเฉพาะบุคคลนอกเวลา',
      location: 'งานกายภาพบำบัด ชั้น 1',
      contactPhone: '042-766054 ต่อ 112',
      iconName: 'Activity',
      themeColor: 'violet',
      isActive: true,
    },
    {
      id: 'UNIT-LAB',
      code: 'LAB',
      hosxpDepcode: '008',
      name: 'ศูนย์ตรวจวิเคราะห์สุขภาพครบวงจร (Executive Checkup & Lab)',
      shortName: 'ตรวจสุขภาพ & LAB พิเศษ',
      description: 'แพ็กเกจตรวจสุขภาพเชิงรุก คัดกรองโรคหัวใจ หลอดเลือด มะเร็ง ตับ ไต และเอกซเรย์ดิจิทัล รู้ผลไวภายใน 2 ชม.',
      location: 'ห้องชันสูตรโรค (LAB) & รังสีวิทยา (X-Ray)',
      contactPhone: '042-766054 ต่อ 108',
      iconName: 'Microscope',
      themeColor: 'blue',
      isActive: true,
    },
    {
      id: 'UNIT-VIP',
      code: 'VIP',
      hosxpDepcode: '035',
      name: 'หอผู้ป่วยพิเศษ & การดูแลมารดา-ทารก (VIP Ward & Maternal)',
      shortName: 'ห้องพิเศษ VIP / ห้องคลอด',
      description: 'บริการจองห้องพักผู้ป่วยในพิเศษเดี่ยว (ตึกร่มโพธิ์ 84 ปี) และแพ็กเกจดูแลฝากครรภ์-คลอดคุณภาพ',
      location: 'ตึกร่มโพธิ์ 84 ปี ชั้น 2-3 และห้องคลอด',
      contactPhone: '042-766054 ต่อ 305',
      iconName: 'BedDouble',
      themeColor: 'rose',
      isActive: true,
    },
  ];

  const packages: SpecialPackage[] = [
    {
      id: 'PKG-OPD-01',
      code: 'OPD-EXEC-35',
      unitId: 'UNIT-OPD',
      hosxpDepcode: '001',
      title: 'แพ็กเกจตรวจสุขภาพประจำปีข้าราชการ & บุคคลทั่วไป (อายุ 35 ปีขึ้นไป)',
      subtitle: 'ตรวจครบ 14 รายการ พร้อมเอกซเรย์ปอด และคลื่นไฟฟ้าหัวใจ EKG (ช่องทางด่วน Fast Track)',
      description: 'บริการตรวจสุขภาพครบวงจรตามสิทธิกรมบัญชีกลางและอปท. พร้อมพบแพทย์สรุปผลแบบไม่ต้องรอคิวห้องตรวจปกติ มีอาหารว่างและเครื่องดื่มบริการ',
      durationMinutes: 60,
      basePrice: 1650,
      specialClinicFee: 150,
      inclusions: [
        'ตรวจความสมบูรณ์ของเม็ดเลือด (CBC) และระดับน้ำตาล (FBS)',
        'ตรวจไขมันครบชุด (Cholesterol, Triglyceride, HDL, LDL)',
        'ตรวจการทำงานของตับ (SGOT, SGPT, ALK) และไต (BUN, Creatinine)',
        'ตรวจกรดยูริก (Uric Acid) และตรวจปัสสาวะสมบูรณ์แบบ (UA)',
        'เอกซเรย์ปอดดิจิทัล (Chest X-Ray) และคลื่นไฟฟ้าหัวใจ (EKG)',
        'พบแพทย์เฉพาะทางสรุปผลสุขภาพ + คูปองอาหารว่างเช้า',
      ],
      preparation: 'งดน้ำและอาหารอย่างน้อย 8-10 ชั่วโมงก่อนเจาะเลือด (จิบน้ำเปล่าได้)',
      rightsPricing: [
        {
          rightCategory: 'OFC',
          rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
          isEligible: true,
          claimableAmount: 1500,
          copayAmount: 150,
          privilegeNote: 'เบิกจ่ายตรงค่าตรวจสุขภาพตามเกณฑ์กรมบัญชีกลาง ชำระเฉพาะค่าบริการคลินิกพิเศษ 150 บาท',
        },
        {
          rightCategory: 'LGO',
          rightName: 'สิทธิข้าราชการท้องถิ่น / อปท. (LGO)',
          isEligible: true,
          claimableAmount: 1500,
          copayAmount: 150,
          privilegeNote: 'เบิกจ่ายตรงสิทธิ อปท. ตามอัตราที่กำหนด ชำระค่าบริการช่องทางด่วน 150 บาท',
        },
        {
          rightCategory: 'UCS',
          rightName: 'สิทธิบัตรทอง 30 บาท (UCS)',
          isEligible: true,
          claimableAmount: 450,
          copayAmount: 1200,
          privilegeNote: 'ใช้สิทธิคัดกรองความเสี่ยงพื้นฐาน P&P ได้ ชำระส่วนเกินรายการตรวจพิเศษเพิ่มเติม',
        },
        {
          rightCategory: 'SSS',
          rightName: 'สิทธิประกันสังคม (SSS)',
          isEligible: true,
          claimableAmount: 550,
          copayAmount: 1100,
          privilegeNote: 'ใช้สิทธิตรวจสุขภาพประจำปีประกันสังคมร่วมได้ ชำระเฉพาะส่วนเกิน',
        },
        {
          rightCategory: 'CASH',
          rightName: 'ชำระเงินเอง (Self-Pay)',
          isEligible: true,
          claimableAmount: 0,
          copayAmount: 1650,
          privilegeNote: 'ราคาเหมาจ่ายพิเศษประหยัดกว่าตรวจแยกรายการ 30%',
        },
      ],
      schedules: [
        {
          id: 'SCH-OPD-01A',
          label: 'รอบเช้า ช่องทางด่วน (จันทร์ - ศุกร์)',
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '07:30',
          endTime: '10:30',
          maxQuota: 15,
          roomName: 'จุดบริการ Fast Track หน้าห้องตรวจ 1',
          providerName: 'ทีมแพทย์และพยาบาลตรวจสุขภาพ',
          isActive: true,
        },
        {
          id: 'SCH-OPD-01B',
          label: 'รอบวันเสาร์ คลินิกตรวจสุขภาพพิเศษ',
          daysOfWeek: [6],
          startTime: '08:00',
          endTime: '12:00',
          maxQuota: 20,
          roomName: 'ห้องตรวจโรค 1 (คลินิกพิเศษวันเสาร์)',
          providerName: 'แพทย์เวรคลินิกพิเศษนอกเวลา',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-11-01T08:00:00.000Z',
    },
    {
      id: 'PKG-OPD-02',
      code: 'OPD-EVENING',
      unitId: 'UNIT-OPD',
      hosxpDepcode: '001',
      title: 'คลินิกพิเศษผู้ป่วยนอกนอกเวลาราชการ (SMC Evening Clinic)',
      subtitle: 'ตรวจรักษาโรคทั่วไป โรคเรื้อรัง NCDs และขอใบรับรองแพทย์ นอกเวลา ไม่ต้องลางาน',
      description: 'เปิดให้บริการสำหรับผู้รับบริการทุกสิทธิ์ที่ต้องการความสะดวกรวดเร็วหลังเลิกงาน หรือวันหยุดราชการ พร้อมรับยาที่จุดบริการเบ็ดเสร็จ',
      durationMinutes: 30,
      basePrice: 300,
      specialClinicFee: 150,
      inclusions: [
        'ค่าบริการทางการแพทย์คลินิกพิเศษนอกเวลา',
        'ตรวจวินิจฉัยโดยแพทย์และซักประวัติช่องทางด่วน',
        'บริการจัดยาและชำระเงินจุดเดียว (One-Stop Service)',
      ],
      preparation: 'นำบัตรประชาชน หรือเปิดแอปพลิเคชัน ThaID มายืนยันที่จุดรับบริการก่อนเวลานัด 10 นาที',
      rightsPricing: [
        {
          rightCategory: 'OFC',
          rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
          isEligible: true,
          claimableAmount: 150,
          copayAmount: 150,
          privilegeNote: 'ค่ายาและเวชภัณฑ์เบิกจ่ายตรงได้ตามสิทธิ ชำระค่าธรรมเนียมคลินิกนอกเวลา 150 บาท',
        },
        {
          rightCategory: 'LGO',
          rightName: 'สิทธิ อปท. (LGO)',
          isEligible: true,
          claimableAmount: 150,
          copayAmount: 150,
          privilegeNote: 'ค่ายาเบิกจ่ายตรงตามสิทธิ อปท. ชำระค่าธรรมเนียมคลินิกนอกเวลา 150 บาท',
        },
        {
          rightCategory: 'UCS',
          rightName: 'สิทธิบัตรทอง (UCS)',
          isEligible: true,
          claimableAmount: 150,
          copayAmount: 150,
          privilegeNote: 'ใช้สิทธิรับยาตามบัญชียาหลักได้ ชำระเฉพาะค่าบริการคลินิกพิเศษนอกเวลา 150 บาท',
        },
        {
          rightCategory: 'SSS',
          rightName: 'สิทธิประกันสังคม (SSS)',
          isEligible: true,
          claimableAmount: 150,
          copayAmount: 150,
          privilegeNote: 'ในเครือข่ายใช้สิทธิค่ายาได้ ชำระค่าบริการคลินิกพิเศษนอกเวลา 150 บาท',
        },
        {
          rightCategory: 'CASH',
          rightName: 'ชำระเงินเอง (Self-Pay)',
          isEligible: true,
          claimableAmount: 0,
          copayAmount: 300,
          privilegeNote: 'ค่าบริการเริ่มต้น 300 บาท (ไม่รวมค่ายาตามจริง)',
        },
      ],
      schedules: [
        {
          id: 'SCH-OPD-02A',
          label: 'คลินิกนอกเวลาตอนเย็น (จันทร์ - ศุกร์)',
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '16:30',
          endTime: '20:00',
          maxQuota: 25,
          roomName: 'ห้องตรวจโรค 2 (SMC)',
          providerName: 'แพทย์เวรคลินิกพิเศษนอกเวลา',
          isActive: true,
        },
        {
          id: 'SCH-OPD-02B',
          label: 'คลินิกนอกเวลาวันหยุด (เสาร์ - อาทิตย์)',
          daysOfWeek: [0, 6],
          startTime: '08:30',
          endTime: '12:00',
          maxQuota: 20,
          roomName: 'ห้องตรวจโรค 2 (SMC)',
          providerName: 'แพทย์เวรคลินิกพิเศษวันหยุด',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-11-01T08:10:00.000Z',
    },
    {
      id: 'PKG-TTM-01',
      code: 'TTM-SPA-90',
      unitId: 'UNIT-TTM',
      hosxpDepcode: '025',
      title: 'แพ็กเกจนวดรักษาและประคบสมุนไพรสดพรีเมียม 90 นาที',
      subtitle: 'แก้อาการออฟฟิศซินโดรม ปวดคอบ่าไหล่ สะบักจม ด้วยลูกประคบสมุนไพรสูตรเข้มข้น',
      description: 'ตรวจประเมินธาตุเจ้าเรือนและโครงสร้างกล้ามเนื้อโดยแพทย์แผนไทยประยุกต์ นวดกดจุดแก้อาการ 60 นาที ตามด้วยประคบสมุนไพรสดร้อน 30 นาที ในห้องบริการส่วนตัว',
      durationMinutes: 90,
      basePrice: 450,
      specialClinicFee: 100,
      inclusions: [
        'ตรวจวินิจฉัยโดยแพทย์แผนไทย (ซักประวัติ-ตรวจร่างกาย)',
        'นวดไทยเพื่อการรักษาเฉพาะจุด 60 นาที',
        'ประคบสมุนไพรสดสูตรโรงพยาบาลโคกศรีสุพรรณ 30 นาที',
        'น้ำสมุนไพรต้อนรับเพื่อการผ่อนคลาย',
      ],
      preparation: 'สวมเสื้อผ้าที่สบาย ไม่ควรรับประทานอาหารอิ่มเกินไปก่อนรับบริการ 30 นาที',
      rightsPricing: [
        {
          rightCategory: 'OFC',
          rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
          isEligible: true,
          claimableAmount: 250,
          copayAmount: 200,
          privilegeNote: 'เบิกจ่ายตรงค่านวดรักษา/ประคบตามเกณฑ์ 250 บาท ชำระส่วนเกินเวลาพิเศษ 200 บาท',
        },
        {
          rightCategory: 'LGO',
          rightName: 'สิทธิ อปท. (LGO)',
          isEligible: true,
          claimableAmount: 250,
          copayAmount: 200,
          privilegeNote: 'เบิกจ่ายตรงสิทธิ อปท. 250 บาท ชำระส่วนเกินแพ็กเกจพิเศษ 200 บาท',
        },
        {
          rightCategory: 'UCS',
          rightName: 'สิทธิบัตรทอง (UCS)',
          isEligible: true,
          claimableAmount: 200,
          copayAmount: 250,
          privilegeNote: 'กรณีมีข้อบ่งชี้ทางการแพทย์ลดหย่อนได้ตามสิทธิ ชำระค่าบริการเสริมสมุนไพรพิเศษ 250 บาท',
        },
        {
          rightCategory: 'SSS',
          rightName: 'สิทธิประกันสังคม (SSS)',
          isEligible: true,
          claimableAmount: 200,
          copayAmount: 250,
          privilegeNote: 'ใช้สิทธิร่วมการรักษาฟื้นฟูได้ ชำระส่วนเกิน 250 บาท',
        },
        {
          rightCategory: 'CASH',
          rightName: 'ชำระเงินเอง (Self-Pay)',
          isEligible: true,
          claimableAmount: 0,
          copayAmount: 450,
          privilegeNote: 'ชำระเหมาจ่าย 450 บาท (90 นาทีเต็ม)',
        },
      ],
      schedules: [
        {
          id: 'SCH-TTM-01A',
          label: 'รอบในเวลา ช่องทางจองล่วงหน้า (จันทร์ - ศุกร์)',
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '13:00',
          endTime: '16:00',
          maxQuota: 8,
          roomName: 'ห้องหัตถการพิเศษ แพทย์แผนไทย 1',
          providerName: 'ทีมแพทย์แผนไทย รพ.โคกศรีสุพรรณ',
          isActive: true,
        },
        {
          id: 'SCH-TTM-01B',
          label: 'รอบนอกเวลาเย็น (จันทร์ - ศุกร์)',
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '16:30',
          endTime: '19:30',
          maxQuota: 6,
          roomName: 'ห้องหัตถการพิเศษ แพทย์แผนไทย 1',
          providerName: 'ทีมแพทย์แผนไทยคลินิกนอกเวลา',
          isActive: true,
        },
        {
          id: 'SCH-TTM-01C',
          label: 'รอบวันเสาร์ สปาและฟื้นฟูสุขภาพ',
          daysOfWeek: [6],
          startTime: '08:30',
          endTime: '15:30',
          maxQuota: 10,
          roomName: 'ศูนย์การแพทย์แผนไทย',
          providerName: 'ทีมแพทย์แผนไทยคลินิกพิเศษ',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-11-01T08:20:00.000Z',
    },
    {
      id: 'PKG-DENT-01',
      code: 'DENT-VIP-01',
      unitId: 'UNIT-DENT',
      hosxpDepcode: '005',
      title: 'คลินิกทันตกรรมพิเศษนอกเวลา (ขูดหินปูน / อุดฟัน / ถอนฟัน)',
      subtitle: 'รับบริการทันตกรรมโดยทันตแพทย์เฉพาะทาง นอกเวลาราชการ นัดเวลาแน่นอน',
      description: 'ลดปัญหาการรอคิวนานในเวลาราชการ จองคิวระบุช่วงเวลาได้ชัดเจน เครื่องมือปลอดเชื้อมาตรฐานสากล',
      durationMinutes: 45,
      basePrice: 700,
      specialClinicFee: 200,
      inclusions: [
        'ตรวจสุขภาพช่องปากและวางแผนการรักษาโดยทันตแพทย์',
        'ขูดหินปูนและขัดฟันทั้งปาก หรืออุดฟัน 1-2 ด้าน',
        'ชุดปลอดเชื้อมาตรฐานคลินิกทันตกรรมพิเศษ',
      ],
      preparation: 'แปรงฟันให้สะอาดก่อนเข้ารับบริการ และแจ้งประวัติการแพ้ยาหรือโรคประจำตัว',
      rightsPricing: [
        {
          rightCategory: 'OFC',
          rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
          isEligible: true,
          claimableAmount: 500,
          copayAmount: 200,
          privilegeNote: 'เบิกจ่ายตรงค่าหัตถการทันตกรรมตามเกณฑ์กรมบัญชีกลาง ชำระค่าบริการคลินิกนอกเวลา 200 บาท',
        },
        {
          rightCategory: 'LGO',
          rightName: 'สิทธิ อปท. (LGO)',
          isEligible: true,
          claimableAmount: 500,
          copayAmount: 200,
          privilegeNote: 'เบิกจ่ายตรงค่าหัตถการตามสิทธิ อปท. ชำระค่าคลินิกพิเศษ 200 บาท',
        },
        {
          rightCategory: 'SSS',
          rightName: 'สิทธิประกันสังคม กรณีทันตกรรม (SSS)',
          isEligible: true,
          claimableAmount: 700,
          copayAmount: 0,
          privilegeNote: 'ใช้วงเงินทันตกรรมประกันสังคม 900 บาท/ปีได้ ไม่ต้องสำรองจ่าย (หากวงเงินคงเหลือเพียงพอ)',
        },
        {
          rightCategory: 'UCS',
          rightName: 'สิทธิบัตรทอง (UCS)',
          isEligible: true,
          claimableAmount: 400,
          copayAmount: 300,
          privilegeNote: 'ใช้สิทธิพื้นฐานร่วมได้ ชำระค่าธรรมเนียมบริการคลินิกทันตกรรมนอกเวลา 300 บาท',
        },
        {
          rightCategory: 'CASH',
          rightName: 'ชำระเงินเอง (Self-Pay)',
          isEligible: true,
          claimableAmount: 0,
          copayAmount: 700,
          privilegeNote: 'อัตราค่าบริการเหมาจ่ายเริ่มต้น 700 บาท',
        },
      ],
      schedules: [
        {
          id: 'SCH-DENT-01A',
          label: 'คลินิกทันตกรรมนอกเวลาเย็น (จันทร์ - พฤหัสบดี)',
          daysOfWeek: [1, 2, 3, 4],
          startTime: '16:30',
          endTime: '19:30',
          maxQuota: 6,
          roomName: 'ห้องทันตกรรมพิเศษ 1',
          providerName: 'ทันตแพทย์เวรคลินิกนอกเวลา',
          isActive: true,
        },
        {
          id: 'SCH-DENT-01B',
          label: 'คลินิกทันตกรรมวันเสาร์',
          daysOfWeek: [6],
          startTime: '08:30',
          endTime: '12:00',
          maxQuota: 8,
          roomName: 'ห้องทันตกรรมพิเศษ 1-2',
          providerName: 'ทีมทันตแพทย์คลินิกพิเศษ',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-11-01T08:30:00.000Z',
    },
    {
      id: 'PKG-PT-01',
      code: 'PT-LASER-01',
      unitId: 'UNIT-PT',
      hosxpDepcode: '012',
      title: 'โปรแกรมกายภาพบำบัดลดปวดเรื้อรังด้วย High Power Laser & Ultrasound',
      subtitle: 'ฟื้นฟูอาการปวดหลัง หมอนรองกระดูกทับเส้นประสาท ข้อเข่าเสื่อม และออฟฟิศซินโดรม',
      description: 'ตรวจประเมินทางกายภาพบำบัดอย่างละเอียด รักษาด้วยเครื่องเลเซอร์กำลังสูง/อัลตราซาวด์ร่วมกับการดัดดึงข้อต่อ (Mobilization) และแผ่นประคบร้อน',
      durationMinutes: 60,
      basePrice: 550,
      specialClinicFee: 150,
      inclusions: [
        'ตรวจประเมินโครงสร้างร่างกายโดยนักกายภาพบำบัดวิชาชีพ',
        'บำบัดด้วยเครื่อง Ultrasound หรือ High Power Laser เฉพาะจุด',
        'ประคบร้อนลึก (Hot Pack) และเทคนิคคลายพังผืดกล้ามเนื้อ',
        'โปรแกรมท่าบริหารเฉพาะบุคคลกลับไปทำที่บ้าน',
      ],
      preparation: 'สวมกางเกงขาสั้นหรือชุดที่สามารถเปิดบริเวณที่ต้องการรักษาได้สะดวก',
      rightsPricing: [
        {
          rightCategory: 'OFC',
          rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
          isEligible: true,
          claimableAmount: 400,
          copayAmount: 150,
          privilegeNote: 'เบิกจ่ายตรงค่ากายภาพบำบัดตามเกณฑ์ ชำระค่าบริการเครื่องมือพิเศษนอกเวลา 150 บาท',
        },
        {
          rightCategory: 'LGO',
          rightName: 'สิทธิ อปท. (LGO)',
          isEligible: true,
          claimableAmount: 400,
          copayAmount: 150,
          privilegeNote: 'เบิกจ่ายตรงสิทธิ อปท. ชำระส่วนเกินคลินิกพิเศษ 150 บาท',
        },
        {
          rightCategory: 'UCS',
          rightName: 'สิทธิบัตรทอง (UCS)',
          isEligible: true,
          claimableAmount: 250,
          copayAmount: 300,
          privilegeNote: 'ใช้สิทธิกายภาพบำบัดร่วมได้ ชำระค่าบริการเลเซอร์และคลินิกนอกเวลา 300 บาท',
        },
        {
          rightCategory: 'SSS',
          rightName: 'สิทธิประกันสังคม (SSS)',
          isEligible: true,
          claimableAmount: 250,
          copayAmount: 300,
          privilegeNote: 'ใช้สิทธิร่วมได้ ชำระส่วนเกินเครื่องมือพิเศษ 300 บาท',
        },
        {
          rightCategory: 'CASH',
          rightName: 'ชำระเงินเอง (Self-Pay)',
          isEligible: true,
          claimableAmount: 0,
          copayAmount: 550,
          privilegeNote: 'ชำระเหมาจ่าย 550 บาท/ครั้ง',
        },
      ],
      schedules: [
        {
          id: 'SCH-PT-01A',
          label: 'คลินิกกายภาพนอกเวลาเย็น (จันทร์ - ศุกร์)',
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '16:30',
          endTime: '19:30',
          maxQuota: 6,
          roomName: 'ห้องกายภาพบำบัด ชั้น 1',
          providerName: 'นักกายภาพบำบัดวิชาชีพ',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-11-01T08:40:00.000Z',
    },
    {
      id: 'PKG-VIP-01',
      code: 'VIP-ROOM-84',
      unitId: 'UNIT-VIP',
      hosxpDepcode: '035',
      title: 'บริการจองคิวห้องพักผู้ป่วยในพิเศษเดี่ยว (ตึกร่มโพธิ์ 84 ปี)',
      subtitle: 'ห้องพักเดี่ยวมาตรฐาน VIP พร้อมแอร์ ทีวี ตู้เย็น โซฟาญาติ และสิ่งอำนวยความสะดวกครบครัน',
      description: 'สำหรับผู้ป่วยที่มีกำหนดนอนโรงพยาบาล (Admit) หรือเตรียมคลอดบุตร สามารถลงทะเบียนจองคิวห้องพิเศษล่วงหน้าและตรวจสอบส่วนลดตามสิทธิ์การรักษา',
      durationMinutes: 1440,
      basePrice: 1200,
      specialClinicFee: 0,
      inclusions: [
        'ห้องพักเดี่ยวปรับอากาศ พร้อมห้องน้ำส่วนตัวและเครื่องทำน้ำอุ่น',
        'เตียงผู้ป่วยไฟฟ้าปรับระดับ + โซฟาเบดสำหรับญาติเฝ้าไข้',
        'โทรทัศน์ดิจิทัล ตู้เย็น กระติกน้ำร้อน และ Free Wi-Fi',
        'อาหารสำหรับผู้ป่วย 3 มื้อ ตามหลักโภชนาการโรงพยาบาล',
      ],
      preparation: 'ต้องมีคำสั่งรับไว้รักษาในโรงพยาบาล (Admit) จากแพทย์ผู้รักษา',
      rightsPricing: [
        {
          rightCategory: 'OFC',
          rightName: 'สิทธิข้าราชการ / เบิกจ่ายตรง (OFC)',
          isEligible: true,
          claimableAmount: 1000,
          copayAmount: 200,
          privilegeNote: 'เบิกค่าห้องและค่าอาหารได้ตามสิทธิกรมบัญชีกลาง 1,000 บาท/วัน ชำระส่วนเกินเพียง 200 บาท/วัน',
        },
        {
          rightCategory: 'LGO',
          rightName: 'สิทธิ อปท. (LGO)',
          isEligible: true,
          claimableAmount: 1000,
          copayAmount: 200,
          privilegeNote: 'เบิกค่าห้องและค่าอาหารได้ตามสิทธิ อปท. 1,000 บาท/วัน ชำระส่วนเกิน 200 บาท/วัน',
        },
        {
          rightCategory: 'UCS',
          rightName: 'สิทธิบัตรทอง (UCS)',
          isEligible: true,
          claimableAmount: 400,
          copayAmount: 800,
          privilegeNote: 'สิทธิบัตรทองคุ้มครองค่าเตียงสามัญ ชำระส่วนต่างค่าห้องพิเศษเดี่ยว 800 บาท/วัน',
        },
        {
          rightCategory: 'SSS',
          rightName: 'สิทธิประกันสังคม (SSS)',
          isEligible: true,
          claimableAmount: 700,
          copayAmount: 500,
          privilegeNote: 'เบิกค่าห้องตามสิทธิประกันสังคมได้ 700 บาท/วัน ชำระส่วนต่าง 500 บาท/วัน',
        },
        {
          rightCategory: 'CASH',
          rightName: 'ชำระเงินเอง (Self-Pay)',
          isEligible: true,
          claimableAmount: 0,
          copayAmount: 1200,
          privilegeNote: 'อัตราค่าห้องพิเศษเดี่ยว 1,200 บาท/วัน (รวมค่าอาหารผู้ป่วย 3 มื้อ)',
        },
      ],
      schedules: [
        {
          id: 'SCH-VIP-01A',
          label: 'ลงทะเบียนจองคิวห้องพิเศษรายวัน (ทุกวัน)',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '08:00',
          endTime: '16:00',
          maxQuota: 5,
          roomName: 'ตึกร่มโพธิ์ 84 ปี ชั้น 2-3',
          providerName: 'หัวหน้าหอผู้ป่วยในพิเศษ',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-11-01T08:50:00.000Z',
    },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const bookings: SpecialBooking[] = [
    {
      id: 'BKG-SEED-001',
      queueNumber: 'OPD-001',
      packageId: 'PKG-OPD-01',
      packageTitle: 'แพ็กเกจตรวจสุขภาพประจำปีข้าราชการ & บุคคลทั่วไป (อายุ 35 ปีขึ้นไป)',
      unitId: 'UNIT-OPD',
      unitName: 'คลินิกพิเศษผู้ป่วยนอก (OPD VIP & คลินิกนอกเวลา)',
      scheduleId: 'SCH-OPD-01A',
      scheduleLabel: 'รอบเช้า ช่องทางด่วน (จันทร์ - ศุกร์)',
      bookingDate: today,
      timeWindow: '07:30 - 10:30',
      roomName: 'จุดบริการ Fast Track หน้าห้องตรวจ 1',
      patientCid: '1470900012345',
      patientHn: '0012458',
      patientName: 'นางสาวกมลชนก ศรีสุพรรณ (ตัวอย่างคิว)',
      patientPhone: '081-234-5678',
      rightCategory: 'OFC',
      pttypeCode: '09',
      pttypeName: 'สิทธิข้าราชการเบิกจ่ายตรง (OFC)',
      basePrice: 1650,
      claimableAmount: 1500,
      netPayAmount: 150,
      status: 'CONFIRMED',
      bookingChannel: 'THAID_ONLINE',
      clinicalNote: 'ขอตรวจคลื่นไฟฟ้าหัวใจ EKG เพิ่มเติมตามสิทธิอายุ > 35 ปี',
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
    {
      id: 'BKG-SEED-002',
      queueNumber: 'TTM-001',
      packageId: 'PKG-TTM-01',
      packageTitle: 'แพ็กเกจนวดรักษาและประคบสมุนไพรสดพรีเมียม 90 นาที',
      unitId: 'UNIT-TTM',
      unitName: 'ศูนย์การแพทย์แผนไทยและการแพทย์ทางเลือกพิเศษ',
      scheduleId: 'SCH-TTM-01B',
      scheduleLabel: 'รอบนอกเวลาเย็น (จันทร์ - ศุกร์)',
      bookingDate: today,
      timeWindow: '16:30 - 19:30',
      roomName: 'ห้องหัตถการพิเศษ แพทย์แผนไทย 1',
      patientCid: '3470900098765',
      patientHn: '0008912',
      patientName: 'นายวีระพงษ์ โคกศรี (ตัวอย่างคิว)',
      patientPhone: '089-876-5432',
      rightCategory: 'UCS',
      pttypeCode: '89',
      pttypeName: 'บัตรประกันสุขภาพ (บัตรทอง)',
      basePrice: 450,
      claimableAmount: 200,
      netPayAmount: 250,
      status: 'CHECKED_IN',
      bookingChannel: 'THAID_ONLINE',
      clinicalNote: 'ปวดตึงคอบ่าไหล่ข้างขวาเรื้อรัง 2 สัปดาห์',
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    },
  ];

  return { units, packages, bookings };
}

export function loadStore(): StoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const seed = getInitialSeed();
    saveStore(seed);
    return seed;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw) as StoreSchema;
  } catch {
    const seed = getInitialSeed();
    saveStore(seed);
    return seed;
  }
}

export function saveStore(data: StoreSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}
