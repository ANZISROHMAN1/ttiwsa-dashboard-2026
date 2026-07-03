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

const IMAGE_CATEGORIES = [
  "EVIDENCE 1",
  "EVIDENCE 2",
  "EVIDENCE 3",
  "EVIDENCE 4",
  "BA GANGGUAN FFG PELANGGAN",
  "FOTO DENGAN PELANGGAN MEMEGANG BA"
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

  // Track multiple optional files
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const sc = searchParams.get("sc");
    const sto = searchParams.get("sto");
    const item = searchParams.get("item");

    if (sc || sto || item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Max dimension to keep file size small
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          const base64Data = dataUrl.split(",")[1];
          resolve(base64Data);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitState("loading");

    try {
      // Process all selected files using the compressor
      const filePayloads = [];
      for (const category of Object.keys(selectedFiles)) {
        const file = selectedFiles[category];
        const compressedBase64 = await compressImage(file);
        
        filePayloads.push({
          category: category,
          name: file.name,
          mimeType: "image/jpeg", // We converted it to JPEG in compression
          data: compressedBase64
        });
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
        files: filePayloads.length > 0 ? filePayloads : undefined
      };

      console.log("Submission payload size:", JSON.stringify(payload).length, "bytes");

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
        setSelectedFiles({});
        setSubmitState("idle");
      }, 3000);
    } catch {
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 3000);
    }
  };

  const handleFileChange = (category: string, file: File | null) => {
    setSelectedFiles(prev => {
      const next = { ...prev };
      if (file) {
        next[category] = file;
      } else {
        delete next[category];
      }
      return next;
    });
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

            {/* MULTIPLE OPTIONAL UPLOADS */}
            <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="mb-4">
                <label className="block text-sm font-bold text-foreground">
                  EVIDENCE KENDALA
                </label>
                <div className="text-sm text-foreground-muted mt-1 italic font-semibold">
                  Upload supported evidence. You can upload multiple images to different categories (Optional).
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {IMAGE_CATEGORIES.map((category) => {
                  const file = selectedFiles[category];
                  return (
                    <div key={category} className="flex flex-col">
                      <span className="text-xs font-semibold mb-2 text-foreground-muted truncate" title={category}>
                        {category}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors min-h-[100px] ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:border-accent-blue bg-[var(--surface)] hover:bg-blue-500/5'}`}>
                          <svg className={`w-6 h-6 mb-1 ${file ? 'text-emerald-500' : 'text-accent-blue'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-xs font-medium text-center text-foreground px-2 truncate w-full">
                            {file ? file.name : "Upload Image"}
                          </span>
                          {file && (
                            <span className="text-[10px] text-foreground-muted mt-1">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(category, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        {file && (
                          <button
                            type="button"
                            onClick={() => handleFileChange(category, null)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors h-fit self-center"
                            title="Remove file"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {submitState === "loading" && "Submitting (Compressing)..."}
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
