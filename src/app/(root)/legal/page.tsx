import LegalContent from "@/components/legal/LegalContent";
import { LEGAL_METADATA } from "@/constats/legal";
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tab } = await searchParams;
  const validTab = ["about", "privacy", "terms"].includes(tab || "") ? tab! : "about";
  return LEGAL_METADATA[validTab as keyof typeof LEGAL_METADATA];
}

export default function LegalPage() {
   return (
    <Suspense>
      <LegalContent />
    </Suspense>
  );
}