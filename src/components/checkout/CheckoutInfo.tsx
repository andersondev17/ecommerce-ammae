"use client";

import { INFO_ITEMS } from "@/lib/constats";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function CheckoutInfo() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    return (
        <section aria-label="Información de compra" className="">
            <ul className="divide-y divide-light-300">
                {INFO_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    const isExpanded = expandedIndex === index;
                    const contentId = `info-content-${index}`;

                    return (
                        <li key={index}>
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                aria-expanded={isExpanded}
                                aria-controls={contentId}
                                className="w-full flex items-center gap-4 p-8 text-left hover:bg-light-50 transition-colors"
                            >
                                <Icon className="w-5 h-5 text-dark-900 flex-shrink-0" aria-hidden="true" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-light text-dark-900 font-roboto-slab">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-dark-700 font-light font-roboto">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <ChevronRight
                                    className={`w-4 h-4 text-dark-700 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                    aria-hidden="true"
                                />
                            </button>

                            {isExpanded && (
                                <div id={contentId} className="px-4 pb-4 pl-[60px]" role="region">
                                    <p className="text-xs text-dark-700 font-light font-roboto leading-relaxed">
                                        {item.content}
                                    </p>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}