import { SubmitFormUnspec } from "@/components/dashboard/SubmitFormUnspec";
import { Suspense } from "react";

export default function UnspecSubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitFormUnspec />
    </Suspense>
  );
}
