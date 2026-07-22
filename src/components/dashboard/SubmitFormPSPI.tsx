"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { ChevronDown } from "lucide-react";

const ERROR_CODE_MAP: Record<string, string[]> = {
  "COMPLETED (PS)": [
    "COMPLETED (PS)"
  ],
  "KENDALA PELANGGAN": [
    "ALAMAT TIDAK DITEMUKAN",
    "BATAL",
    "DOUBLE INPUT",
    "GANTI PAKET",
    "INDIKASI CABUT PASANG",
    "KENDALA DEPOSIT",
    "KENDALA IZIN",
    "KENDALA PERANGKAT",
    "PELANGGAN MASIH RAGU",
    "RNA",
    "RUMAH KOSONG"
  ],
  "KENDALA SISTEM": [
    "BELUM PI",
    "KENDALA SISTEM"
  ],
  "KENDALA TEKNIS": [
    "CROSS JALAN",
    "KENDALA IKR/IKG",
    "KENDALA JALUR/RUTE TARIKAN",
    "KENDALA MATERIAL/NTE",
    "LIMITASI ONU",
    "ODP BANDWIDTH RADIO",
    "ODP BELUM GO LIVE",
    "ODP FULL",
    "ODP GENDONG",
    "ODP JAUH",
    "ODP LOSS",
    "ODP LOSS/RETI/RUSAK",
    "ODP NODE-B",
    "ODP RETI",
    "ODP RUSAK",
    "SALAH TAGGING",
    "TIANG",
    "TIDAK ADA ODP",
    "UNSC"
  ],
  "ON PROGRESS": [
    "MANJA H+",
    "MANJA HI",
    "PENDING",
    "PROSES INSTALASI",
    "SISA PI"
  ],
  "OTHERS": [
    "CUACA/HUJAN",
    "LAINNYA",
    "MATI LISTRIK"
  ]
};

interface FormData {
  nomorOrder: string;
  errorCode: string;
  subErrorCode: string;
  keterangan: string;
}

interface FormErrors {
  [key: string]: string;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function SubmitFormPSPI() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    nomorOrder: "",
    errorCode: "",
    subErrorCode: "",
    keterangan: "",
  });

  useEffect(() => {
    const sc = searchParams.get("sc") || searchParams.get("sc_orderid");
    const error = searchParams.get("error") || searchParams.get("errorCode");
    const subError = searchParams.get("subError") || searchParams.get("subErrorCode");
    const keterangan = searchParams.get("keterangan");

    if (sc || error || subError || keterangan) {
      setFormData((prev) => ({
        ...prev,
        ...(sc ? { nomorOrder: sc } : {}),
        ...(error ? { errorCode: error } : {}),
        ...(subError ? { subErrorCode: subError } : {}),
        ...(keterangan ? { keterangan } : {}),
      }));
    }
  }, [searchParams]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nomorOrder.trim()) newErrors.nomorOrder = "NOMOR ORDER is required";
    if (!formData.errorCode.trim()) newErrors.errorCode = "ERROR CODE is required";
    if (!formData.subErrorCode.trim()) newErrors.subErrorCode = "SUB ERROR CODE is required";
    if (!formData.keterangan.trim()) newErrors.keterangan = "KETERANGAN is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitState("loading");

    try {
      const recaptchaToken = await getRecaptchaToken("submit_ps_pi");

      const payload = {
        sheet: "PS/PI-Web",
        recaptchaToken: recaptchaToken || undefined,
        data: {
          Timestamp: (() => {
            const d = new Date();
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
          })(),
          "sc_orderid": formData.nomorOrder,
          "ERROR CODE": formData.errorCode,
          "SUB ERROR CODE": formData.subErrorCode,
          "KETERANGAN": formData.keterangan,
        },
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload)
      });

      const gasJson = await response.json();

      if (!response.ok) {
        throw new Error(gasJson.error || "Failed to submit data");
      }

      setSubmitState("success");

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch {
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="glass-card overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 lg:p-8 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 className="text-2xl font-bold text-foreground">
            UPDATE PS/PI
          </h2>
          <p className="text-sm text-foreground-muted mt-2">
            Submit update data PS/PI
          </p>
          <div className="mt-4 text-xs text-rose-500 font-semibold">* Indicates required question</div>
        </div>

        <div className="p-6 lg:p-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="NOMOR ORDER (sc_orderid) *" id="form-nomorOrder" required error={errors.nomorOrder}>
                <input
                  id="form-nomorOrder"
                  type="text"
                  className="form-input"
                  placeholder="Your answer"
                  value={formData.nomorOrder}
                  onChange={(e) => updateField("nomorOrder", e.target.value)}
                />
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="ERROR CODE *" id="form-errorCode" required error={errors.errorCode}>
                <div className="relative">
                  <select
                    id="form-errorCode"
                    className="form-input appearance-none"
                    value={formData.errorCode}
                    onChange={(e) => {
                      updateField("errorCode", e.target.value);
                      updateField("subErrorCode", ""); // reset sub error code when error code changes
                    }}
                  >
                    <option value="" disabled>Select Error Code</option>
                    {Object.keys(ERROR_CODE_MAP).map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="SUB ERROR CODE *" id="form-subErrorCode" required error={errors.subErrorCode}>
                <div className="relative">
                  <select
                    id="form-subErrorCode"
                    className="form-input appearance-none"
                    value={formData.subErrorCode}
                    onChange={(e) => updateField("subErrorCode", e.target.value)}
                    disabled={!formData.errorCode}
                  >
                    <option value="" disabled>
                      {formData.errorCode ? "Select Sub Error Code" : "Select Error Code first"}
                    </option>
                    {formData.errorCode && ERROR_CODE_MAP[formData.errorCode]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="KETERANGAN *" id="form-keterangan" required error={errors.keterangan}>
                <textarea
                  id="form-keterangan"
                  className="form-input min-h-[100px] resize-y"
                  placeholder="Your answer"
                  value={formData.keterangan}
                  onChange={(e) => updateField("keterangan", e.target.value)}
                />
              </FormField>
            </div>

            <div className="pt-4 pb-2 flex justify-between items-center">
              <button
                type="submit"
                disabled={submitState === "loading" || submitState === "success"}
                className={`btn-primary px-8 py-2.5 shadow-md ${submitState === "success"
                    ? "!bg-emerald-500"
                    : submitState === "error"
                      ? "!bg-rose-500"
                      : ""
                  }`}
              >
                {submitState === "idle" && "Submit"}
                {submitState === "loading" && "Submitting..."}
                {submitState === "success" && "Submitted"}
                {submitState === "error" && "Failed"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
