import * as yup from "yup";
import { POLICY_TYPES, POLICY_STATUS } from "@/types/policy";

export const policyFormSchema = yup.object().shape({
  policyNumber: yup.string().required("Poliçe numarası zorunludur"),
  customerId: yup.number().required("Müşteri seçimi zorunludur"),
  customerName: yup.string().required("Müşteri adı zorunludur"),
  tcNumber: yup
    .string()
    .required("TC numarası zorunludur")
    .matches(/^[0-9]{11}$/, "TC numarası 11 haneli olmalıdır"),
  plateNumber: yup.string().optional(),
  startDate: yup.date().required("Başlangıç tarihi zorunludur"),
  endDate: yup
    .date()
    .required("Bitiş tarihi zorunludur")
    .min(
      yup.ref("startDate"),
      "Bitiş tarihi başlangıç tarihinden sonra olmalıdır"
    ),
  premium: yup
    .number()
    .required("Prim tutarı zorunludur")
    .min(0, "Prim tutarı 0'dan büyük olmalıdır"),
  policyType: yup
    .string()
    .required("Poliçe türü zorunludur")
    .oneOf(POLICY_TYPES, "Geçersiz poliçe türü"),
  status: yup
    .string()
    .required("Durum zorunludur")
    .oneOf(POLICY_STATUS, "Geçersiz durum"),
  description: yup.string().required("Açıklama zorunludur"),
}) as yup.ObjectSchema<PolicyFormSchema>;

export type PolicyFormSchema = {
  policyNumber: string;
  customerId: number;
  customerName: string;
  tcNumber: string;
  plateNumber?: string;
  startDate: Date;
  endDate: Date;
  premium: number;
  policyType: (typeof POLICY_TYPES)[number];
  status: "Aktif" | "Pasif" | "İptal";
  description: string;
};
