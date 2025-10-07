"use client";

import { useCartStore } from "@/store/cart.store";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import SocialProviders from "./SocialProviders";
import { Button } from "./ui/Button";

type Props = {
  mode: "sign-in" | "sign-up";
  onSubmit: (formData: FormData) => Promise<{ ok: boolean; userId?: string } | void>;
};

export default function AuthForm({ mode, onSubmit }: Props) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mergeGuestCart } = useCartStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const redirectTo = searchParams.get('redirect') || '/';

    try {
      const result = await onSubmit(formData);

      if (result?.ok) {
        // If user successfully logged in and we have a userId, merge guest cart
        if (result.userId) {
          await mergeGuestCart(result.userId);
        }

        // Redirect to the specified URL or home page
        router.push(redirectTo);
      }
    } catch (e) {
      console.log("error", e);
    }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-caption text-dark-700 font-roboto">
          {mode === "sign-in" ? "¿No tienes una cuenta?  " : "¿Ya tienes una cuenta? "}
          <Link href={mode === "sign-in" ? "/sign-up" : "/sign-in"} className="underline">
            {mode === "sign-in" ? "Registrate" : "Inicia Sesión"}
          </Link>
        </p>
        <h1 className="mt-3 text-heading-3 text-dark-900 font-roboto-slab">
          {mode === "sign-in" ? "Bienvenido de nuevo!" : "Únete a AMMAE hoy"}
        </h1>
        <p className="mt-1 text-body text-dark-700 font-roboto">
          {mode === "sign-in"
            ? "Inicia sesión para continuar con tu compra"
            : "Crea tu cuenta para empezar tu viaje de moda"}
        </p>
      </div>

      <SocialProviders variant={mode} />

      <div className="flex items-center gap-4">
        <hr className="h-px w-full border-0 bg-light-300" />
        <span className="shrink-0 text-caption text-dark-700 font-roboto">
          O {mode === "sign-in" ? "inicia sesión" : "registrate"} con
        </span>
        <hr className="h-px w-full border-0 bg-light-300" />
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        {mode === "sign-up" && (
          <div className="space-y-1">
            <label htmlFor="name" className="text-caption text-dark-900 font-roboto">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ingresa tu nombre"
              className="w-full rounded-xl border border-light-300 bg-light-100 px-4 py-3 text-body text-dark-900 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              autoComplete="name"
            />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-caption text-dark-900 font-roboto">
            Correo electronico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu.email@dominio.com"
            className="w-full rounded-xl border border-light-300 bg-light-100 px-4 py-3 text-body text-dark-900 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-caption text-dark-900 font-roboto">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl border border-light-300 bg-light-100 px-4 py-3 pr-12 text-body text-dark-900 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-caption text-dark-700"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>



        {mode === "sign-up" && (
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="terms_accepted"
                required
                className="mt-0.5 h-4 w-4 rounded border-light-300 text-dark-900 focus:ring-dark-900 focus:ring-2"
              />
              <span className="text-footnote text-dark-700 font-roboto leading-relaxed">
                Acepto los{" "}
                <Link
                  href="/legal?tab=terms"
                  className="underline hover:text-dark-900 transition-colors"
                  target="_blank"
                >
                  Términos y Condiciones
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="privacy_accepted"
                required
                className="mt-0.5 h-4 w-4 rounded border-light-300 text-dark-900 focus:ring-dark-900 focus:ring-2"
              />
              <span className="text-footnote text-dark-700 font-roboto leading-relaxed">
                Acepto la{" "}
                <Link
                  href="/legal?tab=privacy"
                  className="underline hover:text-dark-900 transition-colors"
                  target="_blank"
                >
                  Política de Privacidad
                </Link>
                {" "}y autorizo el tratamiento de mis datos personales
              </span>
            </label>
          </div>
        )}
        <Button
          type="submit" fullWidth disabled={loading}
        >
          {loading
            ? mode === "sign-in"
              ? "Iniciando sesión..."
              : "Creando cuenta..."
            : mode === "sign-in"
              ? "Iniciar Sesión"
              : "Crear Cuenta"
          }
        </Button>
      </form>
    </div>
  );
}
