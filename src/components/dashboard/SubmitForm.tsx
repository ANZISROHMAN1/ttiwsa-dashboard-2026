"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";

interface FormData {
  sto: string;
  namaTeknisi: string;
  nikTeknisi: string;
  mitra: string;
  nomorOrder: string;
  itemNotComply: string;
  symptomKendala: string;
  keteranganDetail: string;
  alasanGangguanBaru: string;
  alasanPenyelesaianLama: string;
}

interface FormErrors {
  [key: string]: string;
}

type SubmitState = "idle" | "loading" | "success" | "error";

interface SubmitFormProps {
  stoList: string[];
}

const SYMPTOM_OPTIONS = [
  "[FFG] BAIK SENDIRI",
  "[FFG] DIGIGIT TIKUS JALUR IKR",
  "[FFG] DIGIGIT TIKUS JALUR SPBT",
  "[FFG] GANTI ADAPTOR",
  "[FFG] GESER PERANGKAT MANDIRI",
  "[FFG] INET LAMBAT TBB LAPSUNG",
  "[FFG] LOKASI TERKENA GAMAS",
  "[FFG] PERANGKAT PELANGGAN / MIKROTIK dll",
  "[FFG] POHON TUMBANG",
  "[FFG] RENOVASI RUMAH / PERAPIHAN RUMAH",
  "[FFG] SHARING KONEKSI",
  "[FFG/TTI] STOCK ONT KOSONG",
  "[FFG] TERKENA LAYANGAN",
  "[FFG] VANDALISME",
  "[TTI] ANTRIAN WO DI MANJA YANG SAMA",
  "[TTI] AUTO PI KARENA RNA/ATK/RUKOS",
  "[TTI] KENDALA CUACA",
  "[TTI] KENDALA IZIN",
  "[TTI] KENDALA MATRIAL PENGEBONAN",
  "[TTI] KEPASTIAN MINAT INDIBIZ",
  "[TTI] MENUNGGU ODP GOLIVE",
  "[TTI] ODP RETI/LOSS",
  "[TTI] ORDER ONDESK HD",
  "[TTI] PDA WITEL LAIN",
  "[TTI] PELANGGAN RAGU / GANTI PAKET",
  "[TTI] PENGUSUTAN PORT ODP FULL",
  "[TTI] PERBAIKAN SUBDUCT MAMPET",
  "[TTI] PT2 SIMPLE",
  "[TTI] REMANJA PELANGGAN",
  "[TTI] SALAH TAGGING DARI UNIT LAIN",
  "[FFG/TTI] GANGGUAN SISTEM",
  "[FFG/TTI] PPJAB / PKS",
  "[TTI] PERLU ACTION UNIT LAIN"
];

export function SubmitForm({ stoList }: SubmitFormProps) {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    sto: "",
    namaTeknisi: "",
    nikTeknisi: "",
    mitra: "",
    nomorOrder: "",
    itemNotComply: "",
    symptomKendala: "",
    keteranganDetail: "",
    alasanGangguanBaru: "",
    alasanPenyelesaianLama: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-fill from URL query params (from UPDATE REASON button)
  useEffect(() => {
    const sc = searchParams.get("sc");
    const sto = searchParams.get("sto");
    const item = searchParams.get("item");

    if (sc || sto || item) {
      setFormData((prev) => ({
        ...prev,
        ...(sto ? { sto } : {}),
        ...(sc ? { nomorOrder: sc } : {}),
        ...(item ? { itemNotComply: item } : {}),
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

    if (!formData.sto) newErrors.sto = "STO is required";
    if (!formData.namaTeknisi.trim()) newErrors.namaTeknisi = "NAMA TEKNISI is required";
    if (!formData.nikTeknisi.trim()) newErrors.nikTeknisi = "NIK TEKNISI is required";
    if (!formData.mitra.trim()) newErrors.mitra = "MITRA is required";
    if (!formData.nomorOrder.trim()) newErrors.nomorOrder = "NOMOR ORDER / NOMOR TIKET INCIDENT is required";
    if (!formData.itemNotComply) newErrors.itemNotComply = "ITEM NOT COMPLY is required";
    if (!formData.symptomKendala) newErrors.symptomKendala = "SYMTOM KENDALA is required";
    if (!formData.keteranganDetail.trim()) newErrors.keteranganDetail = "KETERANGAN DETAIL KENDALA is required";

    if (formData.itemNotComply === "FFG atau TTR FFG NOT COMPLY") {
      if (!formData.alasanGangguanBaru.trim()) {
        newErrors.alasanGangguanBaru = "This field is required for FFG";
      }
      if (!formData.alasanPenyelesaianLama.trim()) {
        newErrors.alasanPenyelesaianLama = "This field is required for FFG";
      }
    }

    if (!selectedFile) {
      newErrors.evidenceKendala = "Please upload an evidence image";
    } else if (selectedFile.size > 10 * 1024 * 1024) {
      newErrors.evidenceKendala = "File size must be less than 10 MB";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitState("loading");

    try {
      let filePayload = undefined;
      if (selectedFile) {
        const base64Data = await readFileAsBase64(selectedFile);
        filePayload = {
          name: selectedFile.name,
          mimeType: selectedFile.type,
          data: base64Data
        };
      }

      const payload = {
        sheet: "EVIDENT-AREA-WEB",
        data: {
          Timestamp: (() => {
            const d = new Date();
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
          })(),
          STO: formData.sto,
          "NOMOR ORDER / NOMOR TIKET INCIDENT": formData.nomorOrder,
          "NAMA TEKNISI": formData.namaTeknisi,
          "NIK TEKNISI": formData.nikTeknisi,
          MITRA: formData.mitra,
          "ITEM NOT COMPLY": formData.itemNotComply,
          "SYMTOM KENDALA": formData.symptomKendala,
          "KETERANGAN DETAIL KENDALA": formData.keteranganDetail
        },
        file: filePayload
      };

      console.log("Submission payload:", payload);

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

      // We assume success if the fetch didn't throw a network error and response was ok
      setSubmitState("success");

      setTimeout(() => {
        setFormData({
          sto: "",
          namaTeknisi: "",
          nikTeknisi: "",
          mitra: "",
          nomorOrder: "",
          itemNotComply: "",
          symptomKendala: "",
          keteranganDetail: "",
          alasanGangguanBaru: "",
          alasanPenyelesaianLama: "",
        });
        setSelectedFile(null);
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
            UPDATE PENYEBAB NOT COMPLY TTI, FFG, & TTR FFG
          </h2>
          <p className="text-sm text-foreground-muted mt-2">
            DISIPLIN SUBMIT AGAR LEBIH EFEKTIF
          </p>
          <div className="mt-4 text-xs text-rose-500 font-semibold">* Indicates required question</div>
        </div>

        <div className="p-6 lg:p-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="STO *" id="form-sto" required error={errors.sto}>
                <select
                  id="form-sto"
                  className="form-input form-select"
                  value={formData.sto}
                  onChange={(e) => updateField("sto", e.target.value)}
                >
                  <option value="">Your answer</option>
                  {stoList.map((sto) => (
                    <option key={sto} value={sto}>
                      {sto}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="NAMA TEKNISI *" id="form-namaTeknisi" required error={errors.namaTeknisi}>
                <input
                  id="form-namaTeknisi"
                  type="text"
                  className="form-input"
                  placeholder="Your answer"
                  value={formData.namaTeknisi}
                  onChange={(e) => updateField("namaTeknisi", e.target.value)}
                />
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="NIK TEKNISI *" id="form-nikTeknisi" required error={errors.nikTeknisi}>
                <input
                  id="form-nikTeknisi"
                  type="text"
                  className="form-input"
                  placeholder="Your answer"
                  value={formData.nikTeknisi}
                  onChange={(e) => updateField("nikTeknisi", e.target.value)}
                />
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="MITRA *" id="form-mitra" required error={errors.mitra}>
                <input
                  id="form-mitra"
                  type="text"
                  className="form-input"
                  placeholder="Your answer"
                  value={formData.mitra}
                  onChange={(e) => updateField("mitra", e.target.value)}
                />
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="mb-2">
                <label htmlFor="form-nomorOrder" className="block text-sm font-bold text-foreground">
                  NOMOR ORDER / NOMOR TIKET INCIDENT <span className="text-rose-500">*</span>
                </label>
                <div className="text-sm text-foreground-muted mt-1">
                  Format wajib: AOI4 nya saja, jika Indibiz SC1xxxx
                </div>
              </div>
              <input
                id="form-nomorOrder"
                type="text"
                className={`form-input ${errors.nomorOrder ? "border-rose-500" : ""}`}
                placeholder="Your answer"
                value={formData.nomorOrder}
                onChange={(e) => updateField("nomorOrder", e.target.value)}
              />
              {errors.nomorOrder && <p className="mt-1 text-xs text-rose-500">{errors.nomorOrder}</p>}
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-bold text-foreground mb-4">
                ITEM NOT COMPLY <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="itemNotComply"
                    value="TTI NOT COMPLY"
                    checked={formData.itemNotComply === "TTI NOT COMPLY"}
                    onChange={(e) => updateField("itemNotComply", e.target.value)}
                    className="w-4 h-4 text-accent-blue bg-background border-[var(--border)] focus:ring-accent-blue"
                  />
                  <span className="text-sm font-medium text-foreground">TTI NOT COMPLY</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="itemNotComply"
                    value="FFG atau TTR FFG NOT COMPLY"
                    checked={formData.itemNotComply === "FFG atau TTR FFG NOT COMPLY"}
                    onChange={(e) => updateField("itemNotComply", e.target.value)}
                    className="w-4 h-4 text-accent-blue bg-background border-[var(--border)] focus:ring-accent-blue"
                  />
                  <span className="text-sm font-medium text-foreground">FFG atau TTR FFG NOT COMPLY</span>
                </label>
              </div>
              {errors.itemNotComply && <p className="mt-2 text-xs text-rose-500">{errors.itemNotComply}</p>}
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-bold text-foreground mb-4">
                SYMTOM KENDALA <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {SYMPTOM_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="symptomKendala"
                      value={s}
                      checked={formData.symptomKendala === s}
                      onChange={(e) => updateField("symptomKendala", e.target.value)}
                      className="w-4 h-4 text-accent-blue bg-background border-[var(--border)] focus:ring-accent-blue"
                    />
                    <span className="text-sm font-medium text-foreground">{s}</span>
                  </label>
                ))}
              </div>
              {errors.symptomKendala && <p className="mt-2 text-xs text-rose-500">{errors.symptomKendala}</p>}
            </div>

            {formData.itemNotComply === "FFG atau TTR FFG NOT COMPLY" && (
              <>
                <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm animate-fade-in">
                  <FormField label="Kenapa bisa muncul gangguan dlm waktu kurang dr 2 bulan pasca psb? *" id="form-alasan1" required error={errors.alasanGangguanBaru}>
                    <textarea
                      id="form-alasan1"
                      className="form-input min-h-[100px] resize-y"
                      placeholder="Your answer"
                      value={formData.alasanGangguanBaru}
                      onChange={(e) => updateField("alasanGangguanBaru", e.target.value)}
                    />
                  </FormField>
                </div>
                
                <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm animate-fade-in">
                  <FormField label="Dan kenapa penyelesaian gangguan nya lebih dari 3 jam? *" id="form-alasan2" required error={errors.alasanPenyelesaianLama}>
                    <textarea
                      id="form-alasan2"
                      className="form-input min-h-[100px] resize-y"
                      placeholder="Your answer"
                      value={formData.alasanPenyelesaianLama}
                      onChange={(e) => updateField("alasanPenyelesaianLama", e.target.value)}
                    />
                  </FormField>
                </div>
              </>
            )}

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <FormField label="KETERANGAN DETAIL KENDALA *" id="form-keterangan" required error={errors.keteranganDetail}>
                <textarea
                  id="form-keterangan"
                  className="form-input min-h-[100px] resize-y"
                  placeholder="Your answer"
                  value={formData.keteranganDetail}
                  onChange={(e) => updateField("keteranganDetail", e.target.value)}
                />
              </FormField>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="mb-2">
                <label htmlFor="form-evidence" className="block text-sm font-bold text-foreground">
                  EVIDENCE KENDALA <span className="text-rose-500">*</span>
                </label>
                <div className="text-sm text-foreground-muted mt-1 italic font-semibold">
                  Submit Evidence berupa bukti yang mendukung reason dari NOT COMPLY TTI, FFG atau TTR FFG
                </div>
                <div className="text-sm text-foreground-muted mt-2">
                  Upload 1 supported file. Max 10 MB. (Direct image upload)
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <label className={`flex-1 cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors ${errors.evidenceKendala ? 'border-rose-500 bg-rose-500/5 hover:bg-rose-500/10' : 'border-[var(--border)] hover:border-accent-blue bg-[var(--surface)] hover:bg-blue-500/5'}`}>
                  <svg className={`w-8 h-8 mb-2 ${errors.evidenceKendala ? 'text-rose-500' : 'text-accent-blue'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-medium text-foreground">
                    {selectedFile ? selectedFile.name : "Click to upload an image"}
                  </span>
                  {selectedFile && (
                    <span className="text-xs text-foreground-muted mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (errors.evidenceKendala) {
                          setErrors(prev => {
                            const next = { ...prev };
                            delete next.evidenceKendala;
                            return next;
                          });
                        }
                      }
                    }}
                  />
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              {errors.evidenceKendala && <p className="mt-2 text-xs text-rose-500">{errors.evidenceKendala}</p>}
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
              <div className="text-xs text-foreground-muted">
                Never submit passwords through Google Forms.
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
