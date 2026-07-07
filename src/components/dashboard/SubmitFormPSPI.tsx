"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";

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
      const payload = {
        sheet: "PS/PI-Web",
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

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setSubmitState("success");

      setTimeout(() => {
        setFormData({
          nomorOrder: "",
          errorCode: "",
          subErrorCode: "",
          keterangan: "",
        });
        setSubmitState("idle");
      }, 3000);
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
                <input
                  id="form-errorCode"
                  type="text"
                  className="form-input"
                  placeholder="Your answer"
                  value={formData.errorCode}
                  onChange={(e) => updateField("errorCode", e.target.value)}
                />
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="SUB ERROR CODE *" id="form-subErrorCode" required error={errors.subErrorCode}>
                <input
                  id="form-subErrorCode"
                  type="text"
                  className="form-input"
                  placeholder="Your answer"
                  value={formData.subErrorCode}
                  onChange={(e) => updateField("subErrorCode", e.target.value)}
                />
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
                className={`btn-primary px-8 py-2.5 shadow-md ${
                  submitState === "success"
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
