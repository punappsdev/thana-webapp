# Design Document: About Us (เกี่ยวกับเรา) Page

**Date**: 2026-07-05  
**Topic**: About Us Page Creation

---

## 1. Overview
Create a dedicated "About Us" page (`/about`) that provides details about Thana Glass Group ("กลุ่มบริษัท ธนา กลาส") and its three affiliated entities/branches.

## 2. Requirements & UI Layout
The page will adopt the **Crystalline Grid Layout** approach:
* **Header / Title**: "เกี่ยวกับเรา" centered divider styled layout.
* **Top Block (Group overview)**:
  * Two-column grid on desktop, stacking on mobile.
  * Left: A square image block showing the company logo badge in a dark-blue background box.
  * Right: A clear description detailing the history and principles of Thana Glass Group.
* **Bottom Block (3 Subsidiaries)**:
  * A responsive 3-column grid layout on desktop, collapsing to 1 column on mobile.
  * Displays details for the three companies:
    1. **บริษัท ธนา กลาส อลูมิเนิ่ม จำกัด (สำนักงานใหญ่)**
    2. **บริษัท ธนา กลาส อลูมิเนิ่ม จำกัด (สาขา 00001)**
    3. **บริษัท ธนา กลาส ถลาง จำกัด**
  * Note: The "Read More" ("อ่านเพิ่มเติม") buttons have been omitted as per user instruction.
  * Elegant cards with borders matching `#c4e2f5`, border radius `rounded-xl`, soft blue-tinted shadows, and interactive hover animations (slight lift and glow).

## 3. i18n & Localization
Both Thai (`th`) and English (`en`) translations will be provided for the new page.

### `messages/th.json` Additions:
```json
"AboutPage": {
  "title": "เกี่ยวกับเรา",
  "groupTitle": "กลุ่มบริษัท ธนา กลาส",
  "groupDesc1": "เป็นหนึ่งในผู้นำด้านวัสดุก่อสร้างในจังหวัดภูเก็ต โดยดำเนินธุรกิจทั้งในด้านการจำหน่าย อลูมิเนียม กระจก งานฝ้าเพดาน และอุปกรณ์ติดตั้งต่างๆ รวมทั้งยังมี โรงงานแปรรูปกระจก ที่ได้มาตรฐานรองรับงานผลิตคุณภาพสูงอย่างครบวงจร",
  "groupDesc2": "เราคัดสรรสินค้าที่มีคุณภาพดีมีมาตรฐานพร้อมให้บริการด้วยความซื่อสัตย์และจริงใจ ทีมงานของเรายินดีให้คำแนะนำและดูแลลูกค้าทุกท่านด้วยความเป็นกันเอง เพื่อให้ทุกงานติดตั้งเป็นไปอย่างราบรื่น และตอบโจทย์ความต้องการของลูกค้าอย่างแท้จริง",
  "branches": [
    {
      "name": "บริษัท ธนา กลาส อลูมิเนิ่ม จำกัด (สำนักงานใหญ่)",
      "desc": "เป็นคลังวัสดุก่อสร้างขนาดใหญ่แห่งหนึ่งในจังหวัดภูเก็ต ที่ให้บริการด้านการจำหน่ายอลูมิเนียม กระจก งานฝ้าเพดาน และอุปกรณ์ติดตั้งครบวงจร โดยมุ่งเน้นสินค้าที่มีคุณภาพได้มาตรฐาน"
    },
    {
      "name": "บริษัท ธนา กลาส อลูมิเนิ่ม จำกัด (สาขา 00001)",
      "desc": "คือโรงงานแปรรูปกระจกที่ดำเนินงานอย่างครบวงจร ภายใต้สโลแกน \"Quality is remembered long - ผลิตกระจกนิรภัยด้วยคุณภาพให้เป็นที่จดจำตลอดไป\""
    },
    {
      "name": "บริษัท ธนา กลาส ถลาง จำกัด",
      "desc": "คลังวัสดุก่อสร้างครบวงจรในพื้นที่อำเภอถลาง จังหวัดภูเก็ต ให้บริการด้าน การจำหน่ายอลูมิเนียม กระจก ฝ้าเพดาน และอุปกรณ์ติดตั้งต่าง ๆ"
    }
  ]
}
```

### `messages/en.json` Additions:
```json
"AboutPage": {
  "title": "About Us",
  "groupTitle": "Thana Glass Group",
  "groupDesc1": "One of the leading construction material providers in Phuket, operating in the distribution of aluminum, glass, ceiling works, and installation equipment, as well as a comprehensive glass processing factory that meets high manufacturing standards.",
  "groupDesc2": "We select standard, high-quality products and provide services with honesty and integrity. Our team is pleased to advise and take care of all clients in a friendly manner, ensuring smooth installations that truly satisfy customer needs.",
  "branches": [
    {
      "name": "Thana Glass Aluminum Co., Ltd. (Headquarters)",
      "desc": "A large construction materials warehouse in Phuket, providing distribution of aluminum, glass, ceiling works, and comprehensive installation accessories, focusing on standard high-quality products."
    },
    {
      "name": "Thana Glass Aluminum Co., Ltd. (Branch 00001)",
      "desc": "A fully integrated glass processing factory, operating under the slogan \"Quality is remembered long - producing safety glass with quality to be remembered forever.\""
    },
    {
      "name": "Thana Glass Thalang Co., Ltd.",
      "desc": "A complete construction materials warehouse in the Thalang District of Phuket, providing distribution of aluminum, glass, ceiling, and various installation hardware."
    }
  ]
}
```

## 4. Components & Routing
* **Page Path**: `app/[locale]/about/page.tsx`
* **Navigation Link**: `components/layout/header.tsx` will link to `/about` instead of `#`.
* Reuses existing global components: `Header`, `Footer`, and `ContactFab`.
