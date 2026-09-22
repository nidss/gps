// ── ฟอร์มที่อยู่ ใช้ซ้ำทั้งหน้าชำระเงินและหน้าข้อมูลส่วนตัว ────────────
import type { Address } from '../types'
import { Field, Input } from './ui'

export const EMPTY_ADDRESS: Address = {
  name: '', phone: '', line1: '', subDistrict: '', district: '', province: '', postcode: '',
}

export interface AddressErrors {
  name?: string
  phone?: string
  line1?: string
  subDistrict?: string
  district?: string
  province?: string
  postcode?: string
}

/** ตรวจความถูกต้องของที่อยู่ — คืนอ็อบเจ็กต์ว่างถ้าผ่านทั้งหมด */
export function validateAddress(address: Address, nameLabel = 'ชื่อผู้รับ'): AddressErrors {
  const errors: AddressErrors = {}
  if (!address.name.trim()) errors.name = `กรุณากรอก${nameLabel}`
  if (!/^[0-9\s-]{9,}$/.test(address.phone.trim())) errors.phone = 'กรุณากรอกเบอร์โทรให้ถูกต้อง'
  if (!address.line1.trim()) errors.line1 = 'กรุณากรอกบ้านเลขที่และถนน'
  if (!address.subDistrict.trim()) errors.subDistrict = 'กรุณากรอกแขวง/ตำบล'
  if (!address.district.trim()) errors.district = 'กรุณากรอกเขต/อำเภอ'
  if (!address.province.trim()) errors.province = 'กรุณากรอกจังหวัด'
  if (!/^\d{5}$/.test(address.postcode.trim())) errors.postcode = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'
  return errors
}

export function AddressFields({
  value, onChange, errors = {}, nameLabel = 'ชื่อผู้รับ', idPrefix,
}: {
  value: Address
  onChange: (next: Address) => void
  errors?: AddressErrors
  nameLabel?: string
  idPrefix: string
}) {
  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={nameLabel} required error={errors.name}>
        <Input name={`${idPrefix}-name`} value={value.name} onChange={set('name')} placeholder="เช่น สมชาย ใจเร็ว" />
      </Field>

      <Field label="เบอร์โทรติดต่อ" required error={errors.phone}>
        <Input
          name={`${idPrefix}-phone`}
          value={value.phone}
          onChange={set('phone')}
          inputMode="tel"
          placeholder="08X-XXX-XXXX"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="บ้านเลขที่ / หมู่บ้าน / ถนน" required error={errors.line1}>
          <Input
            name={`${idPrefix}-line1`}
            value={value.line1}
            onChange={set('line1')}
            placeholder="เช่น 99/12 หมู่บ้านสปีดเวย์ ซอยพหลโยธิน 32"
          />
        </Field>
      </div>

      <Field label="แขวง / ตำบล" required error={errors.subDistrict}>
        <Input name={`${idPrefix}-subdistrict`} value={value.subDistrict} onChange={set('subDistrict')} />
      </Field>

      <Field label="เขต / อำเภอ" required error={errors.district}>
        <Input name={`${idPrefix}-district`} value={value.district} onChange={set('district')} />
      </Field>

      <Field label="จังหวัด" required error={errors.province}>
        <Input name={`${idPrefix}-province`} value={value.province} onChange={set('province')} />
      </Field>

      <Field label="รหัสไปรษณีย์" required error={errors.postcode}>
        <Input
          name={`${idPrefix}-postcode`}
          value={value.postcode}
          onChange={set('postcode')}
          inputMode="numeric"
          maxLength={5}
          placeholder="10900"
        />
      </Field>
    </div>
  )
}

/** แสดงที่อยู่แบบอ่านอย่างเดียว */
export function AddressView({ address }: { address: Address }) {
  return (
    <address className="not-italic text-sm leading-relaxed text-gp-ink-light">
      <span className="block font-semibold text-gp-ink">{address.name}</span>
      <span className="block">{address.line1}</span>
      <span className="block">
        {address.subDistrict} {address.district} {address.province} {address.postcode}
      </span>
      <span className="block">โทร. {address.phone}</span>
    </address>
  )
}
