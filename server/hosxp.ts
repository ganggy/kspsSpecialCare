import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const host = process.env.HOSXP_HOST || '192.168.2.254';
const port = Number(process.env.HOSXP_PORT || 3306);
const user = process.env.HOSXP_USER || 'opd';
const password = process.env.HOSXP_PASSWORD || '123456';
const database = process.env.HOSXP_DB || 'hos';

export const hosxpPool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
  charset: 'utf8mb4',
});

export type RightCategory = 'OFC' | 'LGO' | 'UCS' | 'SSS' | 'CASH';

export interface PatientRightProfile {
  foundInHosxp: boolean;
  hn: string | null;
  cid: string;
  fullName: string;
  pname: string;
  fname: string;
  lname: string;
  sex: string | null;
  birthDate: string | null;
  phone: string;
  pttypeCode: string;
  pttypeName: string;
  hipdataCode: string;
  rightCategory: RightCategory;
  rightLabel: string;
  lastVisitDate: string | null;
}

export function classifyRightCategory(pttypeCode: string, pttypeName: string, hipdataCode: string): {
  category: RightCategory;
  label: string;
} {
  const code = (hipdataCode || '').toUpperCase().trim();
  const name = (pttypeName || '').toLowerCase();

  if (code === 'OFC' || name.includes('ข้าราชการ') || name.includes('เบิกจ่ายตรง') || name.includes('cscd') || pttypeCode === '09') {
    return { category: 'OFC', label: 'สิทธิข้าราชการ / เบิกจ่ายตรงกรมบัญชีกลาง (OFC)' };
  }
  if (code === 'LGO' || code === 'BKK' || code === 'PTY' || name.includes('อปท') || name.includes('ท้องถิ่น')) {
    return { category: 'LGO', label: 'สิทธิข้าราชการส่วนท้องถิ่น / อปท. (LGO)' };
  }
  if (code === 'SSS' || code === 'SSI' || name.includes('ประกันสังคม')) {
    return { category: 'SSS', label: 'สิทธิประกันสังคม (SSS)' };
  }
  if (code === 'UCS' || code === 'UC' || code === 'WEL' || name.includes('บัตรทอง') || name.includes('30 บาท') || name.includes('ประกันสุขภาพ')) {
    return { category: 'UCS', label: 'สิทธิหลักประกันสุขภาพถ้วนหน้า / บัตรทอง (UCS)' };
  }
  if (code === 'CSH' || code === 'A1' || pttypeCode === '10' || name.includes('ชำระเงิน')) {
    return { category: 'CASH', label: 'ชำระเงินเอง (Self-Pay / Cash)' };
  }
  return { category: 'UCS', label: pttypeName || 'สิทธิหลักประกันสุขภาพ (UCS)' };
}

export async function testHosxpConnection(): Promise<{ ok: boolean; host: string; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    const conn = await hosxpPool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    return {
      ok: true,
      host,
      latencyMs: Date.now() - start,
      message: 'เชื่อมต่อฐานข้อมูล HOSxP (Read-Only) สำเร็จ',
    };
  } catch (err: any) {
    return {
      ok: false,
      host,
      latencyMs: Date.now() - start,
      message: err?.message || 'ไม่สามารถเชื่อมต่อ HOSxP ได้',
    };
  }
}

export async function lookupPatientByCidOrHn(queryValue: string): Promise<PatientRightProfile | null> {
  const clean = (queryValue || '').replace(/[^0-9]/g, '').trim();
  if (!clean) return null;

  try {
    const isCid = clean.length === 13;
    const sql = isCid
      ? `
        SELECT p.hn, p.cid, p.pname, p.fname, p.lname, p.sex,
               DATE_FORMAT(p.birthday, '%Y-%m-%d') AS birthday,
               p.pttype, pt.name AS pttype_name, pt.hipdata_code,
               COALESCE(NULLIF(p.hometel, ''), NULLIF(p.informtel, ''), '') AS phone
        FROM patient p
        LEFT JOIN pttype pt ON p.pttype = pt.pttype
        WHERE p.cid = ?
        LIMIT 1
      `
      : `
        SELECT p.hn, p.cid, p.pname, p.fname, p.lname, p.sex,
               DATE_FORMAT(p.birthday, '%Y-%m-%d') AS birthday,
               p.pttype, pt.name AS pttype_name, pt.hipdata_code,
               COALESCE(NULLIF(p.hometel, ''), NULLIF(p.informtel, ''), '') AS phone
        FROM patient p
        LEFT JOIN pttype pt ON p.pttype = pt.pttype
        WHERE p.hn = ? OR p.hn = LPAD(?, 7, '0') OR p.hn = LPAD(?, 9, '0')
        LIMIT 1
      `;

    const params = isCid ? [clean] : [clean, clean, clean];
    const [rows]: any = await hosxpPool.query(sql, params);

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    let pttypeCode = row.pttype || '10';
    let pttypeName = row.pttype_name || 'ชำระเงินเอง';
    let hipdataCode = row.hipdata_code || 'CSH';
    let lastVisitDate: string | null = null;

    // ดึงสิทธิจากการมารับบริการครั้งล่าสุดใน ovst (Read-Only)
    try {
      const [ovstRows]: any = await hosxpPool.query(
        `
          SELECT o.pttype, pt.name AS pttype_name, pt.hipdata_code,
                 DATE_FORMAT(o.vstdate, '%Y-%m-%d') AS vstdate
          FROM ovst o
          LEFT JOIN pttype pt ON o.pttype = pt.pttype
          WHERE o.hn = ?
          ORDER BY o.vstdate DESC, o.vsttime DESC
          LIMIT 1
        `,
        [row.hn]
      );
      if (ovstRows && ovstRows.length > 0) {
        lastVisitDate = ovstRows[0].vstdate || null;
        if (ovstRows[0].pttype && ovstRows[0].pttype_name) {
          pttypeCode = ovstRows[0].pttype;
          pttypeName = ovstRows[0].pttype_name;
          hipdataCode = ovstRows[0].hipdata_code || hipdataCode;
        }
      }
    } catch {
      // ignore ovst lookup error
    }

    const classified = classifyRightCategory(pttypeCode, pttypeName, hipdataCode);
    const pname = (row.pname || '').trim();
    const fname = (row.fname || '').trim();
    const lname = (row.lname || '').trim();

    return {
      foundInHosxp: true,
      hn: row.hn,
      cid: row.cid || (isCid ? clean : ''),
      fullName: `${pname}${fname} ${lname}`.trim(),
      pname,
      fname,
      lname,
      sex: row.sex || null,
      birthDate: row.birthday || null,
      phone: (row.phone || '').trim(),
      pttypeCode,
      pttypeName,
      hipdataCode,
      rightCategory: classified.category,
      rightLabel: classified.label,
      lastVisitDate,
    };
  } catch (err: any) {
    console.error('[HOSxP Lookup Error]:', err?.message);
    return null;
  }
}

export async function getHosxpDepartments() {
  try {
    const [rows]: any = await hosxpPool.query(`
      SELECT depcode, department, spclty
      FROM kskdepartment
      WHERE department IS NOT NULL AND department != ''
      ORDER BY depcode
    `);
    return rows || [];
  } catch {
    return [];
  }
}

export async function getHosxpActivePttypes() {
  try {
    const [rows]: any = await hosxpPool.query(`
      SELECT pttype, name, pcode, hipdata_code
      FROM pttype
      WHERE isuse = 'Y'
      ORDER BY pttype
    `);
    return rows || [];
  } catch {
    return [];
  }
}
