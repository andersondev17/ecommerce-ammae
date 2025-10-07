'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LEGAL_PAGES } from '@/constats/legal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type LegalTab = 'about' | 'privacy' | 'terms';

const TAB_CLASS = "relative pb-2.5 px-0 text-xs sm:text-sm uppercase tracking-[0.15em] font-light text-dark-500 data-[state=active]:text-dark-900 data-[state=active]:font-normal border-b-2 border-transparent data-[state=active]:border-dark-900 transition-all duration-300 hover:text-dark-700";
const VALID_TABS = ['about', 'privacy', 'terms'] as const;

export default function LegalContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState<LegalTab>('about');
    const isValidTab = (tab: string | null): tab is LegalTab =>
        tab !== null && VALID_TABS.includes(tab as LegalTab);

    useEffect(() => {
        if (isValidTab(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: string) => {
        const newTab = tab as LegalTab;
        setActiveTab(newTab);
        router.push(`/legal?tab=${newTab}`, { scroll: false });
    };

    return (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-24">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-10 sm:space-y-12">
                <TabsList className="inline-flex gap-8 sm:gap-12 border-b border-light-200 font-roboto w-full sm:w-auto overflow-x-auto">
                    {LEGAL_PAGES.map(({ id, label }) => (
                        <TabsTrigger key={id} value={id} className={TAB_CLASS}>
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>


                {LEGAL_PAGES.map((page) => (
                    <TabsContent key={page.id} value={page.id} className="space-y-6">
                        <article className="rounded-xl border border-dark-900/10 bg-white p-8 sm:p-12 hover:border-light-400 transition-colors duration-300">
                            <h1 className="text-2xl sm:text-3xl font-light text-dark-900 mb-10 font-roboto-slab tracking-wide pb-8 border-b border-light-200">
                                {page.title}
                            </h1>
                            <div className="space-y-8">
                                {page.sections.map((section, idx) => (
                                    <section key={idx}>
                                        {section.heading && (
                                            <h2 className="text-lg sm:text-xl font-light text-dark-900 mb-4 font-roboto-slab tracking-wide">
                                                {section.heading}
                                            </h2>
                                        )}
                                        {section.text && (
                                            <p className="text-xs md:text-[13px] text-dark-700 font-roboto font-light leading-relaxed">
                                                {section.text}
                                            </p>
                                        )}
                                        {section.list && (
                                            <ul className="mt-3 space-y-2">
                                                {section.list.map((item, itemIdx) => (
                                                    <li key={itemIdx} className="text-xs md:text-[13px] text-dark-700 font-roboto font-light leading-relaxed flex">
                                                        <span className="mr-3 text-dark-400">•</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))}
                            </div>
                        </article>
                    </TabsContent>
                ))}
            </Tabs>
        </main>
    );
}