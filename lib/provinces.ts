/**
 * Thai provinces, as static reference data rather than a database table — the
 * list changes roughly once a decade and nothing else in the app needs to join
 * against it. `QuotationRequest.province` stores the `code`, never the display
 * name, so a wording change here never rewrites stored records.
 */

export type Province = {
  /** Stable identifier written to the database. */
  code: string;
  nameTh: string;
  nameEn: string;
};

/**
 * The home province. Deliveries anywhere else carry a shipping fee (tempered and
 * laminated glass excepted), which is why this is exported rather than inlined.
 */
export const PHUKET_CODE = "phuket";

/** All 77 provinces, ordered by Thai name. */
export const PROVINCES: Province[] = [
  { code: "krabi", nameTh: "กระบี่", nameEn: "Krabi" },
  { code: "kanchanaburi", nameTh: "กาญจนบุรี", nameEn: "Kanchanaburi" },
  { code: "kalasin", nameTh: "กาฬสินธุ์", nameEn: "Kalasin" },
  { code: "kamphaeng-phet", nameTh: "กำแพงเพชร", nameEn: "Kamphaeng Phet" },
  { code: "khon-kaen", nameTh: "ขอนแก่น", nameEn: "Khon Kaen" },
  { code: "chanthaburi", nameTh: "จันทบุรี", nameEn: "Chanthaburi" },
  { code: "chachoengsao", nameTh: "ฉะเชิงเทรา", nameEn: "Chachoengsao" },
  { code: "chon-buri", nameTh: "ชลบุรี", nameEn: "Chon Buri" },
  { code: "chai-nat", nameTh: "ชัยนาท", nameEn: "Chai Nat" },
  { code: "chaiyaphum", nameTh: "ชัยภูมิ", nameEn: "Chaiyaphum" },
  { code: "chumphon", nameTh: "ชุมพร", nameEn: "Chumphon" },
  { code: "chiang-rai", nameTh: "เชียงราย", nameEn: "Chiang Rai" },
  { code: "chiang-mai", nameTh: "เชียงใหม่", nameEn: "Chiang Mai" },
  { code: "trang", nameTh: "ตรัง", nameEn: "Trang" },
  { code: "trat", nameTh: "ตราด", nameEn: "Trat" },
  { code: "tak", nameTh: "ตาก", nameEn: "Tak" },
  { code: "nakhon-nayok", nameTh: "นครนายก", nameEn: "Nakhon Nayok" },
  { code: "nakhon-pathom", nameTh: "นครปฐม", nameEn: "Nakhon Pathom" },
  { code: "nakhon-phanom", nameTh: "นครพนม", nameEn: "Nakhon Phanom" },
  { code: "nakhon-ratchasima", nameTh: "นครราชสีมา", nameEn: "Nakhon Ratchasima" },
  { code: "nakhon-si-thammarat", nameTh: "นครศรีธรรมราช", nameEn: "Nakhon Si Thammarat" },
  { code: "nakhon-sawan", nameTh: "นครสวรรค์", nameEn: "Nakhon Sawan" },
  { code: "nonthaburi", nameTh: "นนทบุรี", nameEn: "Nonthaburi" },
  { code: "narathiwat", nameTh: "นราธิวาส", nameEn: "Narathiwat" },
  { code: "nan", nameTh: "น่าน", nameEn: "Nan" },
  { code: "bueng-kan", nameTh: "บึงกาฬ", nameEn: "Bueng Kan" },
  { code: "buri-ram", nameTh: "บุรีรัมย์", nameEn: "Buri Ram" },
  { code: "pathum-thani", nameTh: "ปทุมธานี", nameEn: "Pathum Thani" },
  { code: "prachuap-khiri-khan", nameTh: "ประจวบคีรีขันธ์", nameEn: "Prachuap Khiri Khan" },
  { code: "prachin-buri", nameTh: "ปราจีนบุรี", nameEn: "Prachin Buri" },
  { code: "pattani", nameTh: "ปัตตานี", nameEn: "Pattani" },
  { code: "phra-nakhon-si-ayutthaya", nameTh: "พระนครศรีอยุธยา", nameEn: "Phra Nakhon Si Ayutthaya" },
  { code: "phayao", nameTh: "พะเยา", nameEn: "Phayao" },
  { code: "phang-nga", nameTh: "พังงา", nameEn: "Phang Nga" },
  { code: "phatthalung", nameTh: "พัทลุง", nameEn: "Phatthalung" },
  { code: "phichit", nameTh: "พิจิตร", nameEn: "Phichit" },
  { code: "phitsanulok", nameTh: "พิษณุโลก", nameEn: "Phitsanulok" },
  { code: "phetchaburi", nameTh: "เพชรบุรี", nameEn: "Phetchaburi" },
  { code: "phetchabun", nameTh: "เพชรบูรณ์", nameEn: "Phetchabun" },
  { code: "phrae", nameTh: "แพร่", nameEn: "Phrae" },
  { code: PHUKET_CODE, nameTh: "ภูเก็ต", nameEn: "Phuket" },
  { code: "maha-sarakham", nameTh: "มหาสารคาม", nameEn: "Maha Sarakham" },
  { code: "mukdahan", nameTh: "มุกดาหาร", nameEn: "Mukdahan" },
  { code: "mae-hong-son", nameTh: "แม่ฮ่องสอน", nameEn: "Mae Hong Son" },
  { code: "yasothon", nameTh: "ยโสธร", nameEn: "Yasothon" },
  { code: "yala", nameTh: "ยะลา", nameEn: "Yala" },
  { code: "roi-et", nameTh: "ร้อยเอ็ด", nameEn: "Roi Et" },
  { code: "ranong", nameTh: "ระนอง", nameEn: "Ranong" },
  { code: "rayong", nameTh: "ระยอง", nameEn: "Rayong" },
  { code: "ratchaburi", nameTh: "ราชบุรี", nameEn: "Ratchaburi" },
  { code: "lop-buri", nameTh: "ลพบุรี", nameEn: "Lop Buri" },
  { code: "lampang", nameTh: "ลำปาง", nameEn: "Lampang" },
  { code: "lamphun", nameTh: "ลำพูน", nameEn: "Lamphun" },
  { code: "loei", nameTh: "เลย", nameEn: "Loei" },
  { code: "si-sa-ket", nameTh: "ศรีสะเกษ", nameEn: "Si Sa Ket" },
  { code: "sakon-nakhon", nameTh: "สกลนคร", nameEn: "Sakon Nakhon" },
  { code: "songkhla", nameTh: "สงขลา", nameEn: "Songkhla" },
  { code: "satun", nameTh: "สตูล", nameEn: "Satun" },
  { code: "samut-prakan", nameTh: "สมุทรปราการ", nameEn: "Samut Prakan" },
  { code: "samut-songkhram", nameTh: "สมุทรสงคราม", nameEn: "Samut Songkhram" },
  { code: "samut-sakhon", nameTh: "สมุทรสาคร", nameEn: "Samut Sakhon" },
  { code: "sa-kaeo", nameTh: "สระแก้ว", nameEn: "Sa Kaeo" },
  { code: "saraburi", nameTh: "สระบุรี", nameEn: "Saraburi" },
  { code: "sing-buri", nameTh: "สิงห์บุรี", nameEn: "Sing Buri" },
  { code: "sukhothai", nameTh: "สุโขทัย", nameEn: "Sukhothai" },
  { code: "suphan-buri", nameTh: "สุพรรณบุรี", nameEn: "Suphan Buri" },
  { code: "surat-thani", nameTh: "สุราษฎร์ธานี", nameEn: "Surat Thani" },
  { code: "surin", nameTh: "สุรินทร์", nameEn: "Surin" },
  { code: "nong-khai", nameTh: "หนองคาย", nameEn: "Nong Khai" },
  { code: "nong-bua-lam-phu", nameTh: "หนองบัวลำภู", nameEn: "Nong Bua Lam Phu" },
  { code: "ang-thong", nameTh: "อ่างทอง", nameEn: "Ang Thong" },
  { code: "amnat-charoen", nameTh: "อำนาจเจริญ", nameEn: "Amnat Charoen" },
  { code: "udon-thani", nameTh: "อุดรธานี", nameEn: "Udon Thani" },
  { code: "uttaradit", nameTh: "อุตรดิตถ์", nameEn: "Uttaradit" },
  { code: "uthai-thani", nameTh: "อุทัยธานี", nameEn: "Uthai Thani" },
  { code: "ubon-ratchathani", nameTh: "อุบลราชธานี", nameEn: "Ubon Ratchathani" },
  { code: "bangkok", nameTh: "กรุงเทพมหานคร", nameEn: "Bangkok" },
];

const byCode = new Map(PROVINCES.map((province) => [province.code, province]));

export function isProvinceCode(value: string): boolean {
  return byCode.has(value);
}

/**
 * The provinces the business actually serves: Southern Thailand, minus the three
 * southern-border provinces (ยะลา นราธิวาส ปัตตานี). The quote form shows only
 * these; `PROVINCES` above stays the full 77 for admin surfaces like LINE routing
 * that still need nationwide data.
 */
const SOUTHERN_PROVINCE_CODES: readonly string[] = [
  "krabi",
  "chumphon",
  "trang",
  "nakhon-si-thammarat",
  "phang-nga",
  "phatthalung",
  PHUKET_CODE,
  "ranong",
  "songkhla",
  "satun",
  "surat-thani",
];

export const SOUTHERN_PROVINCES: Province[] = PROVINCES.filter((province) =>
  SOUTHERN_PROVINCE_CODES.includes(province.code),
);

const southernByCode = new Set(SOUTHERN_PROVINCE_CODES);

export function isSouthernProvinceCode(value: string): boolean {
  return southernByCode.has(value);
}

/** Display name for a stored code, or null when the code is missing or unknown. */
export function provinceName(code: string | null | undefined, locale: string): string | null {
  if (!code) return null;
  const province = byCode.get(code);
  if (!province) return null;
  return locale === "en" ? province.nameEn : province.nameTh;
}

/** True when a delivery to this province attracts a shipping fee. */
export function isOutsidePhuket(code: string | null | undefined): boolean {
  return Boolean(code) && code !== PHUKET_CODE;
}
