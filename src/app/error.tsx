'use client';

import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-light-100">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <AlertTriangle className="h-16 w-16 text-red" />
                    </div>
                    <h1 className="text-heading-2 text-dark-900 font-roboto-slab">
                        Algo salió mal
                    </h1>
                    <p className="text-body text-dark-700 font-roboto">
                        Ha ocurrido un error inesperado.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90"
                    >
                        Intentar de nuevo
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-dark-900 px-6 py-3 text-body-medium text-dark-900 transition hover:bg-dark-900 hover:text-light-100"
                    >
                        <Home className="h-5 w-5" />
                        Inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}